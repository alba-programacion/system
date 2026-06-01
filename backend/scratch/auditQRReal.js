/**
 * AUDITORÍA REAL DEL FLUJO QR DE ASISTENCIA
 * ============================================
 * Este script verifica directamente en MongoDB:
 * 1. El usuario autenticado (JWT)
 * 2. El documento AttendanceRecord real
 * 3. La lógica de validación de duplicados
 * 4. El estado actual de la BD para todos los usuarios reales
 */

const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const axios = require("axios");
require("dotenv").config();

const BASE_URL = "http://localhost:5000/api";

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

const run = async () => {
  console.log("╔══════════════════════════════════════════════════════════╗");
  console.log("║     AUDITORÍA REAL DEL FLUJO QR DE ASISTENCIA           ║");
  console.log("╚══════════════════════════════════════════════════════════╝\n");

  await mongoose.connect(process.env.MONGO_URI);
  console.log("✅ Conectado a MongoDB Atlas\n");

  const User = require("../src/models/users");
  const Event = require("../src/models/Event");
  const AttendanceSession = require("../src/models/AttendanceSession");
  const AttendanceRecord = require("../src/models/AttendanceRecord");
  const Attendance = require("../src/models/Attendance");
  const Cedula = require("../src/models/Cedula");
  const SystemConfig = require("../src/models/systemConfig");

  // ─────────────────────────────────────────────────────────────────────────
  // SECCIÓN 1: USUARIOS REALES EN LA BD
  // ─────────────────────────────────────────────────────────────────────────
  console.log("══════════════════════════════════════════════════════════");
  console.log("SECCIÓN 1: USUARIOS REALES EN MONGODB");
  console.log("══════════════════════════════════════════════════════════");
  
  const allUsers = await User.find({}).select(
    "numeroControl nombres apPaterno apMaterno correoInstitucional roles genero"
  );
  
  console.log(`\nTotal usuarios en la colección 'users': ${allUsers.length}\n`);
  allUsers.forEach(u => {
    console.log(`  • [${u.roles?.join(",")}] ${u.numeroControl} | ${u.nombres} ${u.apPaterno} ${u.apMaterno || ""} | ${u.correoInstitucional} | ${u.genero}`);
  });

  // ─────────────────────────────────────────────────────────────────────────
  // SECCIÓN 2: CURSO ACTIVO
  // ─────────────────────────────────────────────────────────────────────────
  console.log("\n══════════════════════════════════════════════════════════");
  console.log("SECCIÓN 2: CURSO ACTIVO Y PARTICIPANTES INSCRITOS");
  console.log("══════════════════════════════════════════════════════════");

  const course = await Event.findOne({ type: "course" });
  if (!course) {
    console.log("❌ No hay ningún curso en la BD.");
    process.exit(1);
  }
  
  console.log(`\nCurso: "${course.title}"`);
  console.log(`  _id:        ${course._id}`);
  console.log(`  courseKey:  ${course.courseKey}`);
  console.log(`  instructor: ${course.instructor}`);
  console.log(`  type:       ${course.type}`);

  const cedulas = await Cedula.find({ eventId: course._id }).populate(
    "userId", "numeroControl nombres apPaterno correoInstitucional genero"
  );
  console.log(`\nParticipantes inscritos en Cédula (${cedulas.length}):`);
  cedulas.forEach(c => {
    const u = c.userId;
    if (u) {
      console.log(`  • ${u.numeroControl} | ${u.nombres} ${u.apPaterno} | ${u.correoInstitucional} | userId: ${u._id}`);
    } else {
      console.log(`  • [sin userId] cedula._id: ${c._id}`);
    }
  });

  // ─────────────────────────────────────────────────────────────────────────
  // SECCIÓN 3: ESTADO ACTUAL DE REGISTROS DE ASISTENCIA
  // ─────────────────────────────────────────────────────────────────────────
  console.log("\n══════════════════════════════════════════════════════════");
  console.log("SECCIÓN 3: ESTADO ACTUAL EN MONGODB");
  console.log("══════════════════════════════════════════════════════════");

  const allSessions = await AttendanceSession.find({ courseId: course._id }).sort({ createdAt: -1 });
  console.log(`\nAttendanceSessions para este curso: ${allSessions.length}`);
  allSessions.forEach(s => {
    console.log(`  • _id: ${s._id} | token: ${s.qrToken} | fecha: ${s.sessionDate} | estado: ${s.qrStatus} | expira: ${s.expiresAt}`);
  });

  const allRecords = await AttendanceRecord.find({ courseId: course._id })
    .populate("userId", "numeroControl nombres apPaterno correoInstitucional");
  console.log(`\nAttendanceRecords para este curso: ${allRecords.length}`);
  allRecords.forEach(r => {
    const u = r.userId;
    console.log(`  • RECORD _id: ${r._id}`);
    console.log(`    userId:      ${r.userId?._id || r.userId}`);
    console.log(`    control:     ${u?.numeroControl || "N/A"}`);
    console.log(`    nombre:      ${u ? `${u.nombres} ${u.apPaterno}` : "N/A"}`);
    console.log(`    email:       ${u?.correoInstitucional || "N/A"}`);
    console.log(`    sessionId:   ${r.sessionId}`);
    console.log(`    fecha:       ${r.attendanceDate}`);
    console.log(`    hora:        ${r.attendanceTime}`);
    console.log(`    método:      ${r.registrationMethod}`);
    console.log(`    dispositivo: ${r.deviceInfo}`);
    console.log(`    ip:          ${r.ipAddress}`);
    console.log(`    ---`);
  });

  const legacyAttendances = await Attendance.find({ eventId: course._id })
    .populate("userId", "numeroControl nombres apPaterno");
  console.log(`\nAttendances (colección legacy) para este curso: ${legacyAttendances.length}`);
  legacyAttendances.forEach(a => {
    const u = a.userId;
    console.log(`  • userId: ${a.userId?._id || a.userId} | ${u?.numeroControl || "?"} ${u?.nombres || "?"} | createdAt: ${a.createdAt}`);
  });

  // ─────────────────────────────────────────────────────────────────────────
  // SECCIÓN 4: AUDITORÍA JWT Y ENDPOINT REAL
  // ─────────────────────────────────────────────────────────────────────────
  console.log("\n══════════════════════════════════════════════════════════");
  console.log("SECCIÓN 4: AUDITORÍA DEL JWT Y ENDPOINT REAL");
  console.log("══════════════════════════════════════════════════════════");

  // Seleccionar el profesor con control 201
  const profesor = await User.findOne({ numeroControl: "201" });
  if (!profesor) {
    console.log("❌ Profesor control 201 no encontrado.");
    process.exit(1);
  }
  console.log(`\nProfesor seleccionado para prueba real:`);
  console.log(`  _id:         ${profesor._id}`);
  console.log(`  control:     ${profesor.numeroControl}`);
  console.log(`  nombre:      ${profesor.nombres} ${profesor.apPaterno} ${profesor.apMaterno || ""}`);
  console.log(`  email:       ${profesor.correoInstitucional}`);
  console.log(`  roles:       ${profesor.roles?.join(", ")}`);
  console.log(`  genero:      ${profesor.genero}`);

  // Hacer login real via HTTP para obtener JWT real del sistema
  console.log("\n→ Haciendo login real en http://localhost:5000/api/auth/login...");
  let loginData;
  try {
    const loginRes = await axios.post(`${BASE_URL}/auth/login`, {
      numeroControl: "201",
      correoInstitucional: "profesor@itgam.edu.mx",
      password: "profesor123"
    });
    loginData = loginRes.data;
    console.log(`✅ Login exitoso. Status: ${loginRes.status}`);
  } catch (e) {
    console.log(`❌ Error en login: ${e.response?.status} - ${JSON.stringify(e.response?.data)}`);
    process.exit(1);
  }

  const jwt_token = loginData.token;
  console.log(`\n→ JWT recibido del sistema:`);
  console.log(`  ${jwt_token}`);

  // Decodificar JWT sin verificar la firma (auditoría del payload)
  const decoded = jwt.decode(jwt_token);
  console.log(`\n→ Payload del JWT decodificado:`);
  console.log(`  id:         ${decoded.id}`);
  console.log(`  roles:      ${JSON.stringify(decoded.roles)}`);
  console.log(`  iat:        ${new Date(decoded.iat * 1000).toISOString()}`);
  console.log(`  exp:        ${new Date(decoded.exp * 1000).toISOString()}`);
  
  // Confirmar que req.usuario.id coincide con el _id del profesor
  const match = decoded.id === profesor._id.toString();
  console.log(`\n  ¿JWT.id coincide con profesor._id? ${match ? "✅ SÍ" : "❌ NO"}`);
  console.log(`  JWT.id:       ${decoded.id}`);
  console.log(`  profesor._id: ${profesor._id}`);

  // ─────────────────────────────────────────────────────────────────────────
  // SECCIÓN 5: LIMPIAR REGISTROS PREVIOS Y CREAR SESIÓN FRESCA
  // ─────────────────────────────────────────────────────────────────────────
  console.log("\n══════════════════════════════════════════════════════════");
  console.log("SECCIÓN 5: LIMPIEZA Y CREACIÓN DE SESIÓN FRESCA");
  console.log("══════════════════════════════════════════════════════════");

  // Limpiar todos los AttendanceRecords de este profesor en este curso
  const deletedRecords = await AttendanceRecord.deleteMany({ 
    userId: profesor._id, 
    courseId: course._id 
  });
  console.log(`\n🧹 AttendanceRecords eliminados del profesor: ${deletedRecords.deletedCount}`);

  // Limpiar Attendance legacy
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date(todayStart);
  todayEnd.setDate(todayEnd.getDate() + 1);
  const deletedLegacy = await Attendance.deleteMany({
    eventId: course._id,
    userId: profesor._id,
    createdAt: { $gte: todayStart, $lt: todayEnd }
  });
  console.log(`🧹 Attendance (legacy) eliminadas del profesor: ${deletedLegacy.deletedCount}`);

  // Limpiar todas las AttendanceSessions del curso
  const deletedSessions = await AttendanceSession.deleteMany({ courseId: course._id });
  console.log(`🧹 AttendanceSessions eliminadas: ${deletedSessions.deletedCount}`);

  // Desactivar requireLocation temporalmente
  const sysConfig = await SystemConfig.findOne();
  const origRequireLocation = sysConfig?.requireLocation;
  if (sysConfig) {
    sysConfig.requireLocation = false;
    await sysConfig.save();
    console.log(`✅ requireLocation deshabilitado (era: ${origRequireLocation})`);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // SECCIÓN 6: CREAR SESIÓN QR COMO ADMIN
  // ─────────────────────────────────────────────────────────────────────────
  console.log("\n══════════════════════════════════════════════════════════");
  console.log("SECCIÓN 6: ADMIN GENERA SESIÓN QR");
  console.log("══════════════════════════════════════════════════════════");

  // Login admin
  const adminLoginRes = await axios.post(`${BASE_URL}/auth/login`, {
    numeroControl: "101",
    correoInstitucional: "admin@itgam.edu.mx",
    password: "admin123"
  });
  const adminToken = adminLoginRes.data.token;
  const adminDecoded = jwt.decode(adminToken);
  console.log(`\n→ Admin logueado. JWT.id = ${adminDecoded.id}`);

  // Crear sesión QR via API
  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`;
  
  let sessionData;
  try {
    const sessionRes = await axios.post(`${BASE_URL}/attendance/session`, {
      courseId: course._id.toString(),
      sessionDate: todayStr
    }, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    sessionData = sessionRes.data.session;
    console.log(`✅ Sesión QR creada exitosamente:`);
    console.log(`   _id:        ${sessionData._id}`);
    console.log(`   qrToken:    ${sessionData.qrToken}`);
    console.log(`   sessionDate: ${sessionData.sessionDate}`);
    console.log(`   startTime:  ${sessionData.startTime}`);
    console.log(`   endTime:    ${sessionData.endTime}`);
    console.log(`   expiresAt:  ${sessionData.expiresAt}`);
    console.log(`   qrStatus:   ${sessionData.qrStatus}`);
    console.log(`   courseId:   ${sessionData.courseId}`);
  } catch (e) {
    console.log(`❌ Error creando sesión: ${e.response?.status} - ${JSON.stringify(e.response?.data)}`);
    process.exit(1);
  }

  // URL del QR (lo que se codifica en el SVG del QR)
  const qrUrl = `http://localhost:5173/asistencia/${sessionData.qrToken}`;
  console.log(`\n→ URL que contiene el QR: ${qrUrl}`);
  console.log(`→ Token que extrae el escáner jsQR: ${sessionData.qrToken}`);

  // ─────────────────────────────────────────────────────────────────────────
  // SECCIÓN 7: PROFESOR REGISTRA ASISTENCIA
  // ─────────────────────────────────────────────────────────────────────────
  console.log("\n══════════════════════════════════════════════════════════");
  console.log("SECCIÓN 7: PROFESOR REGISTRA ASISTENCIA (POST /asistencia/registrar)");
  console.log("══════════════════════════════════════════════════════════");

  console.log(`\n→ Usuario autenticado (req.usuario):`);
  console.log(`   req.usuario.id:              ${decoded.id}`);
  console.log(`   req.usuario.roles:           ${JSON.stringify(decoded.roles)}`);
  console.log(`   (numeroControl desde BD):    ${profesor.numeroControl}`);
  console.log(`   (nombre desde BD):           ${profesor.nombres} ${profesor.apPaterno}`);
  console.log(`   (email desde BD):            ${profesor.correoInstitucional}`);

  console.log(`\n→ Enviando POST /api/attendance/asistencia/registrar...`);
  console.log(`   token: ${sessionData.qrToken}`);
  console.log(`   latitude: null`);
  console.log(`   longitude: null`);
  console.log(`   deviceInfo: "PC Windows (Auditoría Real)"`);

  let registroData;
  try {
    const registroRes = await axios.post(`${BASE_URL}/attendance/asistencia/registrar`, {
      token: sessionData.qrToken,
      latitude: null,
      longitude: null,
      deviceInfo: "PC Windows (Auditoría Real)"
    }, {
      headers: { Authorization: `Bearer ${jwt_token}` }
    });
    registroData = registroRes.data;
    console.log(`\n✅ Registro exitoso! Status: ${registroRes.status}`);
    console.log(`   Response: ${JSON.stringify(registroData)}`);
  } catch (e) {
    console.log(`\n❌ Error en registro: ${e.response?.status} - ${JSON.stringify(e.response?.data)}`);
    process.exit(1);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // SECCIÓN 8: DOCUMENTO REAL EN MONGODB
  // ─────────────────────────────────────────────────────────────────────────
  console.log("\n══════════════════════════════════════════════════════════");
  console.log("SECCIÓN 8: DOCUMENTO AttendanceRecord REAL EN MONGODB");
  console.log("══════════════════════════════════════════════════════════");

  await sleep(500);
  const savedRecord = await AttendanceRecord.findOne({
    sessionId: sessionData._id,
    userId: profesor._id
  }).populate("userId", "numeroControl nombres apPaterno apMaterno correoInstitucional genero");

  if (!savedRecord) {
    console.log("❌ No se encontró el AttendanceRecord en MongoDB.");
  } else {
    const u = savedRecord.userId;
    console.log(`\n📄 DOCUMENTO AttendanceRecord GUARDADO EN MONGODB:`);
    console.log(`   _id:              ${savedRecord._id}`);
    console.log(`   sessionId:        ${savedRecord.sessionId}`);
    console.log(`   courseId:         ${savedRecord.courseId}`);
    console.log(`   userId (ObjectId): ${savedRecord.userId?._id || savedRecord.userId}`);
    console.log(`   ──── Datos del usuario (populate) ────`);
    console.log(`   numeroControl:    ${u?.numeroControl}`);
    console.log(`   nombre:           ${u?.nombres} ${u?.apPaterno} ${u?.apMaterno || ""}`);
    console.log(`   email:            ${u?.correoInstitucional}`);
    console.log(`   genero:           ${u?.genero}`);
    console.log(`   ──── Datos de asistencia ────`);
    console.log(`   attendanceDate:   ${savedRecord.attendanceDate}`);
    console.log(`   attendanceTime:   ${savedRecord.attendanceTime}`);
    console.log(`   registrationMethod: ${savedRecord.registrationMethod}`);
    console.log(`   deviceInfo:       ${savedRecord.deviceInfo}`);
    console.log(`   ipAddress:        ${savedRecord.ipAddress}`);
    
    // Verificar que el userId coincide con el JWT
    const userIdMatch = savedRecord.userId?._id?.toString() === decoded.id;
    console.log(`\n   ¿userId en record coincide con JWT.id?  ${userIdMatch ? "✅ SÍ" : "❌ NO"}`);
    console.log(`   Record userId:  ${savedRecord.userId?._id}`);
    console.log(`   JWT decoded.id: ${decoded.id}`);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // SECCIÓN 9: LÓGICA DE DUPLICADOS
  // ─────────────────────────────────────────────────────────────────────────
  console.log("\n══════════════════════════════════════════════════════════");
  console.log("SECCIÓN 9: AUDITORÍA DE LA LÓGICA DE DUPLICADOS");
  console.log("══════════════════════════════════════════════════════════");

  console.log(`
La consulta REAL de duplicados en registerQRAttendance (línea 402-405):
─────────────────────────────────────────────────────────────
  const existingRecord = await AttendanceRecord.findOne({
      sessionId: session._id,   ← ID de la sesión actual
      userId                    ← ID del usuario autenticado via JWT
  });
─────────────────────────────────────────────────────────────

ANÁLISIS: La validación se hace por (sessionId + userId), NO por courseId.
Esto significa:
  ✅ El mismo usuario PUEDE registrarse en múltiples sesiones del mismo curso (días distintos)
  ✅ El mismo usuario NO puede registrarse dos veces en la misma sesión
  ✅ El mensaje "Ya registraste tu asistencia para esta sesión" es CORRECTO para duplicados
  
El mensaje que observaste: "Ya registraste tu asistencia para este curso"
→ Esto proviene de la LANDING PAGE (/asistencia/:token) cuando el backend retorna 400.
→ La landing page muestra el error del backend: "Ya registraste tu asistencia para esta sesión"
  `);

  // Verificar: ¿existe el mensaje exacto que vio el usuario?
  console.log("→ Simulando intento de doble registro (debe rechazarse):");
  try {
    await axios.post(`${BASE_URL}/attendance/asistencia/registrar`, {
      token: sessionData.qrToken,
      latitude: null,
      longitude: null,
      deviceInfo: "Segundo intento"
    }, {
      headers: { Authorization: `Bearer ${jwt_token}` }
    });
    console.log("  ❌ ERROR: El segundo registro debió ser rechazado");
  } catch (e) {
    console.log(`  ✅ Segundo registro rechazado correctamente.`);
    console.log(`     Status: ${e.response?.status}`);
    console.log(`     Error:  ${JSON.stringify(e.response?.data)}`);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // SECCIÓN 10: TABLA DEL ADMINISTRADOR (getSessionAttendees)
  // ─────────────────────────────────────────────────────────────────────────
  console.log("\n══════════════════════════════════════════════════════════");
  console.log("SECCIÓN 10: TABLA DEL ADMINISTRADOR (asistentes de sesión)");
  console.log("══════════════════════════════════════════════════════════");

  try {
    const attendeesRes = await axios.get(`${BASE_URL}/attendance/session/${sessionData._id}/attendees`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    console.log(`\n→ GET /attendance/session/${sessionData._id}/attendees`);
    console.log(`   Status: ${attendeesRes.status}`);
    console.log(`   Total asistentes: ${attendeesRes.data.length}`);
    attendeesRes.data.forEach(r => {
      const u = r.userId;
      console.log(`\n   REGISTRO EN TABLA ADMIN:`);
      console.log(`     record._id:   ${r._id}`);
      console.log(`     userId:       ${u?._id || r.userId}`);
      console.log(`     control:      ${u?.numeroControl}`);
      console.log(`     nombre:       ${u?.nombres} ${u?.apPaterno} ${u?.apMaterno || ""}`);
      console.log(`     email:        ${u?.correoInstitucional}`);
      console.log(`     fecha:        ${r.attendanceDate}`);
      console.log(`     hora:         ${r.attendanceTime}`);
      console.log(`     método:       ${r.registrationMethod}`);
    });
  } catch (e) {
    console.log(`\n❌ Error obteniendo asistentes: ${e.response?.status} - ${JSON.stringify(e.response?.data)}`);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // SECCIÓN 11: TABLA DEL PROFESOR (mis registros)
  // ─────────────────────────────────────────────────────────────────────────
  console.log("\n══════════════════════════════════════════════════════════");
  console.log("SECCIÓN 11: TABLA DEL PROFESOR (mis registros propios)");
  console.log("══════════════════════════════════════════════════════════");

  try {
    const myRecordsRes = await axios.get(`${BASE_URL}/attendance/my-records/${course._id}`, {
      headers: { Authorization: `Bearer ${jwt_token}` }
    });
    console.log(`\n→ GET /attendance/my-records/${course._id}`);
    console.log(`   Status: ${myRecordsRes.status}`);
    console.log(`   Mis registros: ${myRecordsRes.data.length}`);
    myRecordsRes.data.forEach(r => {
      console.log(`\n   REGISTRO EN TABLA PROFESOR:`);
      console.log(`     record._id:   ${r._id}`);
      console.log(`     userId:       ${r.userId}`);
      console.log(`     fecha:        ${r.attendanceDate}`);
      console.log(`     hora:         ${r.attendanceTime}`);
      console.log(`     método:       ${r.registrationMethod}`);
    });
  } catch (e) {
    console.log(`\n❌ Error obteniendo mis registros: ${e.response?.status} - ${JSON.stringify(e.response?.data)}`);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // SECCIÓN 12: REPORTE ATTENDANCE (tabla semanal del admin)
  // ─────────────────────────────────────────────────────────────────────────
  console.log("\n══════════════════════════════════════════════════════════");
  console.log("SECCIÓN 12: REPORTE SEMANAL (tabla del admin - colección legacy)");
  console.log("══════════════════════════════════════════════════════════");

  try {
    const reportRes = await axios.get(`${BASE_URL}/attendance/report/${course._id}`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    console.log(`\n→ GET /attendance/report/${course._id}`);
    console.log(`   Status: ${reportRes.status}`);
    const report = reportRes.data;
    console.log(`   Curso: ${report.courseName}`);
    console.log(`   Semana: ${report.weekdays?.join(", ")}`);
    console.log(`   Total participantes en reporte: ${report.users?.length}`);
    report.users?.forEach(u => {
      console.log(`\n   ${u.numeroControl} | ${u.nombre} | días: ${u.days?.join(", ")}`);
    });
  } catch (e) {
    console.log(`\n❌ Error obteniendo reporte: ${e.response?.status} - ${JSON.stringify(e.response?.data)}`);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // SECCIÓN 13: RESUMEN FINAL
  // ─────────────────────────────────────────────────────────────────────────
  console.log("\n╔══════════════════════════════════════════════════════════╗");
  console.log("║                  RESUMEN DE AUDITORÍA                   ║");
  console.log("╚══════════════════════════════════════════════════════════╝\n");

  if (savedRecord) {
    const u = savedRecord.userId;
    console.log(`Usuario autenticado (JWT.id):  ${decoded.id}`);
    console.log(`Usuario en AttendanceRecord:   ${savedRecord.userId?._id}`);
    console.log(`¿Coinciden?                    ${savedRecord.userId?._id?.toString() === decoded.id ? "✅ SÍ" : "❌ NO"}`);
    console.log(`\nNúmero de control:  ${u?.numeroControl}`);
    console.log(`Nombre completo:     ${u?.nombres} ${u?.apPaterno} ${u?.apMaterno || ""}`);
    console.log(`Email institucional: ${u?.correoInstitucional}`);
    console.log(`Fecha de asistencia: ${savedRecord.attendanceDate}`);
    console.log(`Hora de asistencia:  ${savedRecord.attendanceTime}`);
    console.log(`Método:              ${savedRecord.registrationMethod}`);
  }

  // Limpieza: restaurar requireLocation
  if (sysConfig) {
    sysConfig.requireLocation = origRequireLocation;
    await sysConfig.save();
    console.log(`\n✅ requireLocation restaurado a: ${origRequireLocation}`);
  }

  // Limpiar registros de prueba
  await AttendanceRecord.deleteMany({ sessionId: sessionData._id });
  await AttendanceSession.deleteMany({ _id: sessionData._id });
  const todayStart2 = new Date();
  todayStart2.setHours(0, 0, 0, 0);
  const todayEnd2 = new Date(todayStart2);
  todayEnd2.setDate(todayEnd2.getDate() + 1);
  await Attendance.deleteMany({ eventId: course._id, userId: profesor._id, createdAt: { $gte: todayStart2, $lt: todayEnd2 } });
  console.log(`🧹 Registros de prueba limpiados.`);

  await mongoose.disconnect();
  console.log("\n✅ Desconectado de MongoDB.");
  process.exit(0);
};

run().catch(e => {
  console.error("❌ Error fatal:", e);
  process.exit(1);
});
