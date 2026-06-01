const Attendance = require("../models/Attendance");
const User = require("../models/users");
const Event = require("../models/Event");
const Cedula = require("../models/Cedula");

// Helper to get local date string YYYY-MM-DD
const getLocalDateString = (d) => {
    const dateObj = new Date(d);
    const year = dateObj.getFullYear();
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const day = String(dateObj.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

// Helper to get Monday-Friday of the week containing refDate
const getWeekDays = (refDate) => {
    const d = new Date(refDate);
    const day = d.getDay(); // 0 Sunday, 1 Monday, etc.
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // adjust when Sunday
    const monday = new Date(d.setDate(diff));
    monday.setHours(0, 0, 0, 0);

    const days = [];
    for (let i = 0; i < 5; i++) {
        const dayDate = new Date(monday);
        dayDate.setDate(monday.getDate() + i);
        days.push(dayDate);
    }
    return days;
};

exports.registerAttendance = async (req, res) => {
    try {
        const { eventId, userId } = req.body;
        
        // Verificar si ya registró asistencia hoy (en hora local del servidor)
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const existing = await Attendance.findOne({
            eventId,
            userId,
            createdAt: { $gte: today, $lt: tomorrow }
        });

        if (existing) {
            return res.status(400).json({ message: "Asistencia ya registrada por hoy" });
        }

        const attendance = new Attendance({ eventId, userId });
        await attendance.save();

        res.status(201).json({ message: "Asistencia registrada con éxito", attendance });
    } catch (error) {
        res.status(500).json({ error: "Error al registrar asistencia" });
    }
};

exports.getAttendanceReport = async (req, res) => {
    try {
        const { eventId } = req.params;
        
        const event = await Event.findById(eventId);
        if (!event) return res.status(404).json({ error: "Evento no encontrado" });

        const isInstructor = event.instructor?.toString() === req.usuario.id;
        const isAdmin = req.usuario.roles.includes("admin");

        if (!isAdmin && !isInstructor) {
            const enrolled = await Cedula.findOne({ eventId, userId: req.usuario.id });
            if (!enrolled) {
                return res.status(403).json({ error: "No tienes permisos para ver el reporte de este curso." });
            }
        }

        // 1. Obtener todas las cédulas inscritas en este evento
        const enrolledCedulas = await Cedula.find({ eventId }).populate("userId");

        // 2. Obtener todas las asistencias registradas para este evento
        const attendances = await Attendance.find({ eventId }).populate("userId");

        // 3. Determinar la fecha de referencia para la semana (primera asistencia, o fecha actual)
        let refDate = new Date();
        if (attendances.length > 0) {
            // Usar la primera fecha registrada
            const sorted = [...attendances].sort((a, b) => new Date(a.date || a.createdAt) - new Date(b.date || b.createdAt));
            refDate = new Date(sorted[0].date || sorted[0].createdAt);
        }

        // Obtener los 5 días de esa semana en formato YYYY-MM-DD
        const weekdays = getWeekDays(refDate).map(d => getLocalDateString(d));

        // 4. Crear una estructura combinada de usuarios (Cedulas + Asistencias sin Cédula)
        const userMap = new Map();

        // Agregar inscritos oficiales
        for (const c of enrolledCedulas) {
            if (!c.userId) continue;
            const uId = c.userId._id.toString();
            userMap.set(uId, {
                userId: uId,
                nombre: `${c.personalData?.nombres || c.userId.nombres || ''} ${c.personalData?.apellidos || (c.userId.apPaterno + ' ' + c.userId.apMaterno) || ''}`.trim(),
                numeroControl: c.userId.numeroControl || "S/N",
                genero: c.personalData?.genero || c.userId.genero || "No especificado"
            });
        }

        // Agregar usuarios que asistieron pero no tienen cédula
        for (const att of attendances) {
            if (!att.userId) continue;
            const uId = att.userId._id.toString();
            if (!userMap.has(uId)) {
                userMap.set(uId, {
                    userId: uId,
                    nombre: `${att.userId.nombres || ''} ${att.userId.apPaterno || ''} ${att.userId.apMaterno || ''}`.trim(),
                    numeroControl: att.userId.numeroControl || "S/N",
                    genero: att.userId.genero || "No especificado"
                });
            }
        }

        const usersList = Array.from(userMap.values());

        // 5. Mapear asistencias diarias para cada usuario
        const usersReport = usersList.map(u => {
            const userAttendances = attendances.filter(att => att.userId && att.userId._id.toString() === u.userId);
            
            // Para cada día de Lunes a Viernes, verificar si tiene asistencia registrada
            const daysStatus = weekdays.map(dayStr => {
                const found = userAttendances.some(att => getLocalDateString(att.date || att.createdAt) === dayStr);
                return found ? "Presente" : "Ausente";
            });

            return {
                ...u,
                days: daysStatus // Array de 5 elementos ("Presente" / "Ausente")
            };
        });

        // 6. Calcular estadísticas de género basadas en los usuarios participantes
        const hombresCount = usersList.filter(u => u.genero.toLowerCase() === "masculino").length;
        const mujeresCount = usersList.filter(u => u.genero.toLowerCase() === "femenino").length;

        // Filtrado de privacidad estricto: Si no es admin ni instructor del curso, ver solo su propio renglón
        let filteredUsersReport = usersReport;
        if (!req.usuario.roles.includes('admin') && !isInstructor) {
            filteredUsersReport = usersReport.filter(u => u.userId === req.usuario.id);
        }

        const report = {
            courseName: event.title,
            courseKey: event.courseKey,
            instructor: event.instructorName,
            period: event.period,
            schedule: event.schedule,
            duration: event.duration,
            weekdays, // Lista de los 5 strings YYYY-MM-DD
            total: (!req.usuario.roles.includes('admin') && !isInstructor) ? filteredUsersReport.length : usersList.length,
            hombres: (!req.usuario.roles.includes('admin') && !isInstructor) ? filteredUsersReport.filter(u => u.genero.toLowerCase() === "masculino").length : hombresCount,
            mujeres: (!req.usuario.roles.includes('admin') && !isInstructor) ? filteredUsersReport.filter(u => u.genero.toLowerCase() === "femenino").length : mujeresCount,
            users: filteredUsersReport
        };

        res.json(report);
    } catch (error) {
        console.error("Error generating attendance report:", error);
        res.status(500).json({ error: "Error al generar el reporte" });
    }
};

// --- QR ATTENDANCE SYSTEM CONTROLLERS ---
const crypto = require("crypto");
const AttendanceSession = require("../models/AttendanceSession");
const AttendanceRecord = require("../models/AttendanceRecord");
const SystemConfig = require("../models/systemConfig");

// Helper to check if a time is within a range (format HH:MM)
const isTimeInRange = (currentTime, startTime, endTime) => {
    return currentTime >= startTime && currentTime <= endTime;
};



// Crear nueva sesión de asistencia QR
exports.createSession = async (req, res) => {
    try {
        const { courseId, sessionDate, startTime, endTime } = req.body;
        const createdBy = req.usuario.id;

        if (!courseId || !sessionDate) {
            return res.status(400).json({ error: "Faltan campos requeridos" });
        }

        const now = new Date();
        const expiresAt = new Date(now.getTime() + 15 * 60 * 1000); // 15 minutos de vigencia

        // Formatear horas por defecto HH:MM
        const HH_start = String(now.getHours()).padStart(2, '0');
        const MM_start = String(now.getMinutes()).padStart(2, '0');
        const calcStartTime = startTime || `${HH_start}:${MM_start}`;

        const HH_end = String(expiresAt.getHours()).padStart(2, '0');
        const MM_end = String(expiresAt.getMinutes()).padStart(2, '0');
        const calcEndTime = endTime || `${HH_end}:${MM_end}`;

        // Generar un token único con UUID v4
        const qrToken = crypto.randomUUID();

        const session = new AttendanceSession({
            courseId,
            sessionDate,
            startTime: calcStartTime,
            endTime: calcEndTime,
            qrToken,
            qrStatus: "active",
            expiresAt,
            createdBy
        });

        await session.save();
        res.status(201).json({ message: "Sesión de asistencia creada con éxito", session });
    } catch (error) {
        console.error("Error al crear sesión:", error);
        res.status(500).json({ error: "Error al crear la sesión de asistencia" });
    }
};

// Regenerar código QR / Token para sesión existente
exports.regenerateToken = async (req, res) => {
    try {
        const { id } = req.params;
        const session = await AttendanceSession.findById(id);

        if (!session) {
            return res.status(404).json({ error: "Sesión no encontrada" });
        }

        const now = new Date();
        session.qrToken = crypto.randomUUID();
        session.qrStatus = "active";
        session.expiresAt = new Date(now.getTime() + 15 * 60 * 1000); // Reiniciar vigencia por 15 minutos exactos
        await session.save();

        res.json({ message: "Token de QR regenerado con éxito", session });
    } catch (error) {
        console.error("Error al regenerar token:", error);
        res.status(500).json({ error: "Error al regenerar el token de asistencia" });
    }
};

// Cancelar/Revocar sesión de asistencia QR
exports.cancelSession = async (req, res) => {
    try {
        const { id } = req.params;
        const session = await AttendanceSession.findById(id);

        if (!session) {
            return res.status(404).json({ error: "Sesión no encontrada" });
        }

        session.qrStatus = "revoked";
        await session.save();

        res.json({ message: "Sesión de asistencia cancelada con éxito", session });
    } catch (error) {
        console.error("Error al cancelar sesión:", error);
        res.status(500).json({ error: "Error al cancelar la sesión de asistencia" });
    }
};

// Obtener detalles de la sesión mediante token
exports.getSessionByToken = async (req, res) => {
    try {
        const { token } = req.params;
        const session = await AttendanceSession.findOne({ qrToken: token }).populate("courseId");

        if (!session) {
            return res.status(404).json({ error: "Sesión/Código QR no válido o no existe" });
        }

        const now = new Date();
        if (session.qrStatus === "active" && now > session.expiresAt) {
            session.qrStatus = "expired";
            await session.save();
        }

        if (session.qrStatus === "revoked") {
            return res.status(400).json({ error: "Este código QR ha sido cancelado por la administración" });
        }

        if (session.qrStatus === "expired" || now > session.expiresAt) {
            return res.status(400).json({ error: "Este código QR ha expirado" });
        }

        res.json({
            session: {
                _id: session._id,
                courseId: session.courseId._id,
                courseTitle: session.courseId.title,
                courseKey: session.courseId.courseKey,
                sessionDate: session.sessionDate,
                startTime: session.startTime,
                endTime: session.endTime,
                qrStatus: session.qrStatus
            }
        });
    } catch (error) {
        console.error("Error al buscar sesión por token:", error);
        res.status(500).json({ error: "Error al validar la sesión de asistencia" });
    }
};

// Registrar asistencia QR del docente
exports.registerQRAttendance = async (req, res) => {
    try {
        const { token, deviceInfo } = req.body;
        const userId = req.usuario.id;

        if (!token) {
            return res.status(400).json({ error: "Token QR es requerido" });
        }

        const session = await AttendanceSession.findOne({ qrToken: token });
        if (!session) {
            return res.status(404).json({ error: "Sesión/Código QR inválido" });
        }

        const now = new Date();
        if (session.qrStatus === "active" && now > session.expiresAt) {
            session.qrStatus = "expired";
            await session.save();
        }

        if (session.qrStatus === "revoked") {
            return res.status(400).json({ error: "Este código QR ha sido cancelado por la administración" });
        }
        if (session.qrStatus === "expired" || now > session.expiresAt) {
            return res.status(400).json({ error: "Este código QR ha expirado" });
        }

        const localDate = getLocalDateString(now);

        if (session.sessionDate !== localDate) {
            const course = await Event.findById(session.courseId);
            if (course && course.date && course.date > localDate) {
                return res.status(400).json({ error: "El curso de capacitación aún no ha iniciado" });
            }
            return res.status(400).json({ error: "Este código QR no corresponde a la sesión de hoy" });
        }

        const HH = String(now.getHours()).padStart(2, '0');
        const MM = String(now.getMinutes()).padStart(2, '0');
        const currentTimeStr = `${HH}:${MM}`;

        if (!isTimeInRange(currentTimeStr, session.startTime, session.endTime)) {
            return res.status(400).json({ error: `Código QR fuera de horario de la sesión (${session.startTime} a ${session.endTime})` });
        }

        const enrolled = await Cedula.findOne({ eventId: session.courseId, userId });
        if (!enrolled) {
            return res.status(400).json({ error: "No estás inscrito en este curso de capacitación" });
        }

        const existingRecord = await AttendanceRecord.findOne({
            sessionId: session._id,
            userId
        });

        if (existingRecord) {
            return res.status(400).json({ error: "Ya registraste tu asistencia para esta sesión" });
        }

        const ipAddress = req.ip || req.headers["x-forwarded-for"] || req.connection.remoteAddress;
        const attendanceTime = `${HH}:${MM}:${String(now.getSeconds()).padStart(2, '0')}`;

        const record = new AttendanceRecord({
            sessionId: session._id,
            courseId: session.courseId,
            userId,
            attendanceDate: localDate,
            attendanceTime,
            ipAddress,
            deviceInfo: deviceInfo || "Desconocido",
            registrationMethod: "QR"
        });

        await record.save();

        // Guardar también en la colección legacy para compatibilidad
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        const todayEnd = new Date(todayStart);
        todayEnd.setDate(todayEnd.getDate() + 1);

        const existingLegacy = await Attendance.findOne({
            eventId: session.courseId,
            userId,
            createdAt: { $gte: todayStart, $lt: todayEnd }
        });

        if (!existingLegacy) {
            const legacyAttendance = new Attendance({
                eventId: session.courseId,
                userId,
                date: now
            });
            await legacyAttendance.save();
        }

        res.status(201).json({
            message: "Asistencia registrada correctamente",
            record: {
                courseTitle: enrolled.courseData?.title || "Curso de Capacitación",
                attendanceDate: localDate,
                attendanceTime
            }
        });
    } catch (error) {
        console.error("Error al registrar asistencia QR:", error);
        res.status(500).json({ error: "Error al registrar tu asistencia" });
    }
};

// Obtener historial de sesiones de un curso
exports.getCourseSessions = async (req, res) => {
    try {
        const { courseId } = req.params;
        const userId = req.usuario.id;

        // Validar que el usuario sea administrador, el instructor del curso, o un docente inscrito
        const course = await Event.findById(courseId);
        if (!course) {
            return res.status(404).json({ error: "Curso no encontrado" });
        }

        const isInstructor = course.instructor?.toString() === userId;
        const isAdmin = req.usuario.roles.includes("admin");

        if (!isAdmin && !isInstructor) {
            const enrolled = await Cedula.findOne({ eventId: courseId, userId });
            if (!enrolled) {
                return res.status(403).json({ error: "No tienes permiso para ver el historial de este curso." });
            }
        }

        const sessions = await AttendanceSession.find({ courseId }).sort({ createdAt: -1 });

        const sessionsWithStats = await Promise.all(sessions.map(async (session) => {
            const count = await AttendanceRecord.countDocuments({ sessionId: session._id });
            return {
                ...session.toObject(),
                attendeesCount: count
            };
        }));

        res.json(sessionsWithStats);
    } catch (error) {
        console.error("Error al obtener sesiones:", error);
        res.status(500).json({ error: "Error al obtener el historial de sesiones" });
    }
};

// Obtener asistentes de una sesión específica
exports.getSessionAttendees = async (req, res) => {
    try {
        const { id } = req.params;
        const records = await AttendanceRecord.find({ sessionId: id })
            .populate("userId", "nombres apPaterno apMaterno numeroControl correoInstitucional genero")
            .sort({ createdAt: 1 });

        res.json(records);
    } catch (error) {
        console.error("Error al obtener asistentes de sesión:", error);
        res.status(500).json({ error: "Error al obtener la lista de asistentes" });
    }
};

// Obtener registros de asistencia propios para un docente y curso
exports.getMyAttendanceRecords = async (req, res) => {
    try {
        const { courseId } = req.params;
        const userId = req.usuario.id;

        const records = await AttendanceRecord.find({ courseId, userId })
            .populate("sessionId", "startTime endTime")
            .populate("courseId", "title")
            .sort({ createdAt: -1 });

        res.json(records);
    } catch (error) {
        console.error("Error al obtener registros propios:", error);
        res.status(500).json({ error: "Error al obtener tus registros de asistencia" });
    }
};

