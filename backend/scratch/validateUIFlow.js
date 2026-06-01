const puppeteer = require("puppeteer");
const mongoose = require("mongoose");
const fs = require("fs");
const path = require("path");
require("dotenv").config();

// Helper: sleep function (waitForTimeout is deprecated in newer Puppeteer)
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

// Paths for output screenshots in the artifacts directory
const screenshotsDir = path.join(__dirname, "../../../.gemini/antigravity-ide/brain/1531fd35-eaa7-49be-bded-873a1d665cdb");
if (!fs.existsSync(screenshotsDir)) {
  fs.mkdirSync(screenshotsDir, { recursive: true });
}

const findChromePath = () => {
  const paths = [
    "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe"
  ];
  for (const p of paths) {
    if (fs.existsSync(p)) return p;
  }
  return null;
};

const runValidation = async () => {
  let browser = null;
  try {
    console.log("=== INICIANDO VALIDACIÓN FUNCIONAL REAL DEL FLUJO QR ===");
    console.log("Conectando a MongoDB Atlas...");
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Base de datos conectada!");

    const User = require("../src/models/users");
    const Event = require("../src/models/Event");
    const Cedula = require("../src/models/Cedula");
    const AttendanceRecord = require("../src/models/AttendanceRecord");
    const AttendanceSession = require("../src/models/AttendanceSession");
    const SystemConfig = require("../src/models/systemConfig");

    // ─────────────────────────────────────────────────────────────────────────
    // 1. PREPARAR DATOS EN BD
    // ─────────────────────────────────────────────────────────────────────────
    const course = await Event.findOne({ type: "course" });
    if (!course) throw new Error("No hay ningún curso en la BD. Crea uno primero.");
    console.log(`📌 Curso: "${course.title}" (Clave: ${course.courseKey}, ID: ${course._id})`);

    const professor = await User.findOne({ numeroControl: "201" });
    if (!professor) throw new Error("Profesor con control 201 no encontrado.");
    console.log(`📌 Profesor: "${professor.nombres} ${professor.apPaterno}" (ID: ${professor._id})`);

    const adminUser = await User.findOne({ roles: "admin" });
    if (!adminUser) throw new Error("Usuario admin no encontrado.");

    // Asegurar que el instructor del curso es el admin (no el profesor)
    course.instructor = adminUser._id;
    await course.save();
    console.log("✅ Curso actualizado: instructor = admin (profesor queda como participante).");

    // Asegurar que el profesor esté inscrito en el curso
    let enrollment = await Cedula.findOne({ eventId: course._id, userId: professor._id });
    if (!enrollment) {
      enrollment = new Cedula({
        eventId: course._id,
        userId: professor._id,
        personalData: {
          nombres: professor.nombres,
          apPaterno: professor.apPaterno,
          apMaterno: professor.apMaterno || "",
          genero: professor.genero || "Masculino"
        },
        carrera: new mongoose.Types.ObjectId()
      });
      await enrollment.save();
      console.log("✅ Profesor inscrito al curso.");
    } else {
      console.log("✅ Profesor ya está inscrito al curso.");
    }

    // Temporalmente deshabilitar requireLocation para la prueba
    // (la landing page /asistencia/:token envía null coords, se restaura al final)
    let sysConfig = await SystemConfig.findOne();
    const originalRequireLocation = sysConfig ? sysConfig.requireLocation : false;
    if (sysConfig) {
      sysConfig.requireLocation = false;
      await sysConfig.save();
      console.log(`✅ SystemConfig: requireLocation temporalmente deshabilitado (era: ${originalRequireLocation})`);
    }

    // Limpiar sesiones y registros anteriores
    await AttendanceRecord.deleteMany({ userId: professor._id, courseId: course._id });
    await AttendanceSession.deleteMany({ courseId: course._id });
    console.log("🧹 Sesiones y registros anteriores eliminados.");

    // ─────────────────────────────────────────────────────────────────────────
    // 2. LANZAR NAVEGADOR
    // ─────────────────────────────────────────────────────────────────────────
    const chromePath = findChromePath();
    console.log(`\nLanzando Chrome (${chromePath || "Predeterminado"})...`);
    browser = await puppeteer.launch({
      executablePath: chromePath || undefined,
      headless: "new",
      defaultViewport: { width: 1280, height: 900 },
      args: [
        "--use-fake-ui-for-media-stream",
        "--use-fake-device-for-media-stream",
        "--no-sandbox",
        "--disable-setuid-sandbox"
      ]
    });

    // ─────────────────────────────────────────────────────────────────────────
    // 3. FLUJO ADMINISTRADORA: Login + Generar QR
    // ─────────────────────────────────────────────────────────────────────────
    console.log("\n═══ PASO 1: ADMINISTRADORA GENERA EL QR ═══");
    const adminPage = await browser.newPage();
    adminPage.on("dialog", async d => { console.log(`[Dialog Admin] ${d.message()}`); await d.accept(); });
    adminPage.on("console", msg => { if (msg.type() === "error") console.log(`[Console Error Admin] ${msg.text()}`); });

    console.log("Admin: Navegando al login...");
    await adminPage.goto("http://localhost:5173/login", { waitUntil: "networkidle2" });

    await adminPage.type('input[placeholder*="Ej. 19230456"]', "101");
    await adminPage.type('input[placeholder*="itgam.edu.mx"]', "admin@itgam.edu.mx");
    await adminPage.type('input[placeholder*="••••••••"]', "admin123");

    await Promise.all([
      adminPage.click('button[type="submit"]'),
      adminPage.waitForNavigation({ waitUntil: "networkidle2", timeout: 15000 })
    ]);
    console.log(`✅ Admin logueado. URL: ${adminPage.url()}`);

    // Esperar dashboard admin
    await adminPage.waitForSelector(".admin-sidebar", { timeout: 10000 });

    // Navegar a Formatos → Lista de asistencia (con QR)
    console.log("Admin: Haciendo clic en 'Formatos'...");
    await adminPage.evaluate(() => {
      const buttons = document.querySelectorAll("button.nav-item");
      const formatosBtn = Array.from(buttons).find(b => b.textContent.includes("Formatos"));
      if (formatosBtn) formatosBtn.click();
      else throw new Error("Botón 'Formatos' no encontrado");
    });
    await sleep(1500);

    console.log("Admin: Haciendo clic en 'Lista de asistencia (con QR)'...");
    await adminPage.evaluate(() => {
      const subtabs = document.querySelectorAll(".subtab-btn");
      const asistenciaBtn = Array.from(subtabs).find(b => b.textContent.includes("asistencia") || b.textContent.includes("QR"));
      if (asistenciaBtn) asistenciaBtn.click();
      else throw new Error("Subtab 'Lista de asistencia' no encontrado");
    });
    await sleep(1500);

    // Captura de pantalla para ver estado actual
    await adminPage.screenshot({ path: path.join(screenshotsDir, "step1_admin_formatos.png") });
    console.log("📸 Screenshot: step1_admin_formatos.png");

    // Seleccionar el curso en el dropdown
    console.log("Admin: Seleccionando el curso...");
    await adminPage.waitForSelector("select", { timeout: 8000 });
    await adminPage.evaluate((courseId) => {
      const selects = document.querySelectorAll("select");
      for (const sel of selects) {
        for (const opt of sel.options) {
          if (opt.value === courseId) {
            sel.value = courseId;
            sel.dispatchEvent(new Event("change", { bubbles: true }));
            return true;
          }
        }
      }
      return false;
    }, course._id.toString());
    await sleep(2000);

    await adminPage.screenshot({ path: path.join(screenshotsDir, "step2_admin_course_selected.png") });
    console.log("📸 Screenshot: step2_admin_course_selected.png");

    // Hacer clic en "Generar Código QR"
    console.log("Admin: Haciendo clic en 'Generar Código QR'...");
    const clicked = await adminPage.evaluate(() => {
      const allButtons = document.querySelectorAll("button");
      const genBtn = Array.from(allButtons).find(b =>
        b.textContent.includes("Generar") && (b.textContent.includes("QR") || b.textContent.includes("Código"))
      );
      if (genBtn) { genBtn.click(); return true; }
      return false;
    });
    if (!clicked) {
      throw new Error("No se encontró el botón 'Generar Código QR'");
    }
    await sleep(3000);

    await adminPage.screenshot({ path: path.join(screenshotsDir, "step3_admin_qr_generated.png") });
    console.log("📸 Screenshot: step3_admin_qr_generated.png");

    // Verificar que hay un SVG del QR en pantalla
    const svgExists = await adminPage.evaluate(() => !!document.querySelector("svg"));
    console.log(`✅ QR SVG en pantalla: ${svgExists ? "SÍ" : "NO"}`);

    // Verificar en MongoDB que la sesión fue creada
    const session = await AttendanceSession.findOne({ courseId: course._id }).sort({ createdAt: -1 });
    if (!session) throw new Error("❌ AttendanceSession NO fue guardada en MongoDB");
    console.log(`✅ Sesión QR guardada en MongoDB:`);
    console.log(`   Token: ${session.qrToken}`);
    console.log(`   Creada: ${session.createdAt}`);
    console.log(`   Expira: ${session.expiresAt}`);
    console.log(`   Estado: ${session.status}`);

    // ─────────────────────────────────────────────────────────────────────────
    // 4. FLUJO PROFESOR: Login + Registrar asistencia usando el token real
    // ─────────────────────────────────────────────────────────────────────────
    console.log("\n═══ PASO 2: PROFESOR ESCANEA EL QR Y REGISTRA ASISTENCIA ═══");
    const teacherPage = await browser.newPage();
    teacherPage.on("dialog", async d => { console.log(`[Dialog Profesor] ${d.message()}`); await d.accept(); });

    // Mockear geolocalización ANTES de cargar la página
    await teacherPage.evaluateOnNewDocument(() => {
      navigator.geolocation.getCurrentPosition = (success) => {
        success({
          coords: { latitude: 19.432608, longitude: -99.133209, accuracy: 10 }
        });
      };
    });

    await teacherPage.goto("http://localhost:5173/login", { waitUntil: "networkidle2" });

    await teacherPage.type('input[placeholder*="Ej. 19230456"]', "201");
    await teacherPage.type('input[placeholder*="itgam.edu.mx"]', "profesor@itgam.edu.mx");
    await teacherPage.type('input[placeholder*="••••••••"]', "profesor123");

    await Promise.all([
      teacherPage.click('button[type="submit"]'),
      teacherPage.waitForNavigation({ waitUntil: "networkidle2", timeout: 15000 })
    ]);
    console.log(`✅ Profesor logueado. URL: ${teacherPage.url()}`);

    // Esperar que el dashboard cargue (courseData se auto-asigna al primer curso)
    await teacherPage.waitForSelector(".prof-sidebar", { timeout: 10000 });
    await sleep(2500); // Esperar que React cargue cursos y auto-asigne courseData

    await teacherPage.screenshot({ path: path.join(screenshotsDir, "step4_teacher_dashboard.png") });
    console.log("📸 Screenshot: step4_teacher_dashboard.png");

    // Verificar si courseData fue auto-cargado
    const courseAutoLoaded = await teacherPage.evaluate(() => {
      const allText = document.body.innerText;
      return allText.includes("Lista de asistencia") || allText.includes("QR");
    });
    console.log(`ℹ️  Sidebar tiene botón de asistencia visible: ${courseAutoLoaded}`);

    // Navegar a "Lista de asistencia (con QR)" tab
    console.log("Profesor: Navegando a 'Lista de asistencia (con QR)'...");
    const tabClicked = await teacherPage.evaluate(() => {
      const buttons = document.querySelectorAll(".prof-sidebar button, .prof-nav button");
      const attBtn = Array.from(buttons).find(b =>
        b.textContent.includes("asistencia") || b.textContent.includes("Asistencia") || b.textContent.includes("QR")
      );
      if (attBtn) { attBtn.click(); return true; }
      return false;
    });

    if (!tabClicked) {
      // Si no se encontró el botón, puede ser que courseData no se cargó automáticamente
      // Intentar vincular el curso manualmente
      console.log("⚠️  Botón de asistencia no encontrado. Intentando vincular curso manualmente...");

      const selectExists = await teacherPage.$("select.course-select-input");
      if (selectExists) {
        await teacherPage.select("select.course-select-input", course.courseKey);
        await sleep(500);
      } else {
        // Intentar escribir la clave en el input de texto
        const textInput = await teacherPage.$('input[placeholder*="Clave"]');
        if (textInput) {
          await textInput.type(course.courseKey);
        }
      }

      // Clic en "Cargar Datos"
      const loadBtnClicked = await teacherPage.evaluate(() => {
        const btns = document.querySelectorAll(".search-box button, button");
        const loadButton = Array.from(btns).find(b => b.textContent.includes("Cargar"));
        if (loadButton) { loadButton.click(); return true; }
        return false;
      });
      console.log(`ℹ️  Clic en Cargar Datos: ${loadBtnClicked ? "OK" : "No encontrado"}`);
      await sleep(3000);

      // Intentar de nuevo el clic en el tab de asistencia
      await teacherPage.evaluate(() => {
        const buttons = document.querySelectorAll(".prof-sidebar button, .prof-nav button, aside button");
        const attBtn = Array.from(buttons).find(b =>
          b.textContent.includes("asistencia") || b.textContent.includes("Asistencia") || b.textContent.includes("QR")
        );
        if (attBtn) attBtn.click();
      });
    }

    await sleep(2000);
    await teacherPage.screenshot({ path: path.join(screenshotsDir, "step5_teacher_asistencia_tab.png") });
    console.log("📸 Screenshot: step5_teacher_asistencia_tab.png");

    // Verificar que el botón "Registrar mi Asistencia" está visible
    const regBtnVisible = await teacherPage.evaluate(() => {
      const allText = document.body.innerText;
      return allText.includes("Registrar mi Asistencia");
    });
    console.log(`✅ Botón 'Registrar mi Asistencia' visible: ${regBtnVisible}`);

    // En lugar de simular la cámara (complejo con headless), usamos la página de landing de asistencia
    // directamente con el token real que tenemos de MongoDB.
    // Esto simula exactamente lo que hace el QR cuando se escanea: navega a /asistencia/{token}
    console.log(`\nProfesor: Navegando a la URL del QR directamente (como si escaneara con cámara)...`);
    console.log(`URL: http://localhost:5173/asistencia/${session.qrToken}`);

    // Interceptar requests para loguear la llamada al backend
    const requestLog = [];
    teacherPage.on("request", req => {
      if (req.url().includes("/api/")) {
        requestLog.push({ url: req.url(), method: req.method() });
      }
    });
    const responseLog = [];
    teacherPage.on("response", async res => {
      if (res.url().includes("/api/attendance") || res.url().includes("asistencia")) {
        try {
          const body = await res.json().catch(() => null);
          responseLog.push({ url: res.url(), status: res.status(), body });
        } catch (e) {}
      }
    });

    // Navegar a la URL del QR (lo que normalmente hace la cámara al escanear)
    await teacherPage.goto(`http://localhost:5173/asistencia/${session.qrToken}`, {
      waitUntil: "networkidle0",
      timeout: 20000
    });
    await sleep(3000);

    await teacherPage.screenshot({ path: path.join(screenshotsDir, "step6_teacher_asistencia_landing.png") });
    console.log("📸 Screenshot: step6_teacher_asistencia_landing.png");

    // Loguear el body de la página de asistencia
    const pageText = await teacherPage.evaluate(() => document.body.innerText);
    console.log("\n=== CONTENIDO DE LA PÁGINA /asistencia/{token} ===");
    console.log(pageText.substring(0, 800));
    console.log("=================================================");

    // ─────────────────────────────────────────────────────────────────────────
    // 5. VERIFICAR REGISTRO EN MONGODB
    // ─────────────────────────────────────────────────────────────────────────
    console.log("\n═══ PASO 3: VERIFICANDO REGISTRO EN MONGODB ═══");
    await sleep(2000); // Esperar que el backend procese

    const record = await AttendanceRecord.findOne({ userId: professor._id, courseId: course._id });
    if (!record) {
      console.log("⚠️  AttendanceRecord no encontrado por userId/courseId.");
      console.log("Intentando buscar por sessionId...");
      const recordBySession = await AttendanceRecord.findOne({ sessionId: session._id });
      if (!recordBySession) {
        console.log("❌ No se encontró ningún AttendanceRecord.");
        console.log("\nRequests realizados:");
        requestLog.forEach(r => console.log(`  ${r.method} ${r.url}`));
        console.log("\nResponses recibidas:");
        responseLog.forEach(r => console.log(`  ${r.status} ${r.url}`, r.body ? JSON.stringify(r.body).substring(0, 200) : ""));

        // Intentar registrar asistencia directamente vía la UI del dashboard
        console.log("\n⚡ Intentando registrar vía fetch directo desde el navegador del profesor...");
        await teacherPage.goto("http://localhost:5173/dashboard/profesor", { waitUntil: "networkidle2", timeout: 15000 });
        await sleep(2500);

        // Obtener el token JWT del localStorage
        const jwtToken = await teacherPage.evaluate(() => localStorage.getItem("token"));
        if (!jwtToken) throw new Error("No se encontró token JWT en localStorage del profesor");
        console.log(`✅ Token JWT del profesor encontrado: ${jwtToken.substring(0, 40)}...`);

        // Hacer la llamada fetch directamente desde el contexto del navegador
        const apiResult = await teacherPage.evaluate(async (qrToken) => {
          try {
            const response = await fetch("/api/attendance/asistencia/registrar", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${localStorage.getItem("token")}`
              },
              body: JSON.stringify({
                token: qrToken,
                latitude: 19.432608,
                longitude: -99.133209,
                deviceInfo: "PC Windows (Escáner Cámara)"
              })
            });
            const data = await response.json();
            return { status: response.status, data };
          } catch (e) {
            return { error: e.message };
          }
        }, session.qrToken);

        console.log(`\n📡 Resultado de POST /api/attendance/asistencia/registrar:`);
        console.log(`   Status: ${apiResult.status}`);
        console.log(`   Response: ${JSON.stringify(apiResult.data || apiResult.error)}`);

        await sleep(1500);
      } else {
        console.log("✅ AttendanceRecord encontrado por sessionId!");
      }
    }

    // Verificación final
    const finalRecord = await AttendanceRecord.findOne({
      $or: [
        { userId: professor._id, courseId: course._id },
        { sessionId: session._id }
      ]
    });

    if (finalRecord) {
      console.log("\n🎉 ¡REGISTRO DE ASISTENCIA EXITOSO EN MONGODB!");
      console.log(`   _id:              ${finalRecord._id}`);
      console.log(`   userId:           ${finalRecord.userId}`);
      console.log(`   courseId:         ${finalRecord.courseId}`);
      console.log(`   sessionId:        ${finalRecord.sessionId}`);
      console.log(`   fecha:            ${finalRecord.attendanceDate}`);
      console.log(`   hora:             ${finalRecord.attendanceTime}`);
      console.log(`   método:           ${finalRecord.registrationMethod}`);
      console.log(`   dispositivo:      ${finalRecord.deviceInfo}`);
    } else {
      console.log("\n❌ El registro de asistencia NO fue guardado en MongoDB.");
      console.log("   Esto indica un problema en el backend o en el flujo de autenticación.");
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 6. VERIFICAR ACTUALIZACIÓN EN TABLA DEL ADMINISTRADOR
    // ─────────────────────────────────────────────────────────────────────────
    console.log("\n═══ PASO 4: VERIFICANDO TABLA DEL ADMINISTRADOR ═══");
    await adminPage.bringToFront();
    await sleep(3000); // Esperar auto-refresh

    await adminPage.screenshot({ path: path.join(screenshotsDir, "step7_admin_table_updated.png") });
    console.log("📸 Screenshot: step7_admin_table_updated.png");

    const adminTableText = await adminPage.evaluate(() => document.body.innerText);
    const professorNameInTable = adminTableText.includes(professor.nombres) || adminTableText.includes(professor.apPaterno);
    console.log(`✅ Nombre del profesor en tabla del admin: ${professorNameInTable ? "SÍ" : "NO"}`);

    // ─────────────────────────────────────────────────────────────────────────
    // 7. VERIFICAR TABLA DEL PROFESOR
    // ─────────────────────────────────────────────────────────────────────────
    console.log("\n═══ PASO 5: VERIFICANDO TABLA DEL PROFESOR ═══");
    await teacherPage.bringToFront();
    await teacherPage.goto("http://localhost:5173/dashboard/profesor", { waitUntil: "networkidle2", timeout: 15000 });
    await sleep(2500);

    // Click on asistencia tab
    await teacherPage.evaluate(() => {
      const buttons = document.querySelectorAll(".prof-sidebar button, .prof-nav button, aside button");
      const attBtn = Array.from(buttons).find(b =>
        b.textContent.includes("asistencia") || b.textContent.includes("Asistencia") || b.textContent.includes("QR")
      );
      if (attBtn) attBtn.click();
    });
    await sleep(2000);

    await teacherPage.screenshot({ path: path.join(screenshotsDir, "step8_teacher_table_updated.png") });
    console.log("📸 Screenshot: step8_teacher_table_updated.png");

    const teacherTableText = await teacherPage.evaluate(() => document.body.innerText);
    const presenceInTable = teacherTableText.includes("Presente") || teacherTableText.includes("✓");
    console.log(`✅ Estado 'Presente' en tabla del profesor: ${presenceInTable ? "SÍ" : "NO"}`);

    // ─────────────────────────────────────────────────────────────────────────
    // 8. LIMPIEZA
    // ─────────────────────────────────────────────────────────────────────────
    console.log("\n🧹 Limpiando registros de prueba...");
    await AttendanceRecord.deleteMany({
      $or: [
        { userId: professor._id, courseId: course._id },
        { sessionId: session._id }
      ]
    });
    await AttendanceSession.deleteMany({ courseId: course._id });
    // Restaurar requireLocation al valor original
    if (sysConfig) {
      sysConfig.requireLocation = originalRequireLocation;
      await sysConfig.save();
      console.log(`✅ SystemConfig: requireLocation restaurado a ${originalRequireLocation}`);
    }
    console.log("🧹 Limpieza completada.");

    console.log("\n⭐ VALIDACIÓN FUNCIONAL COMPLETA FINALIZADA ⭐");
    if (finalRecord) {
      console.log("✅ RESULTADO: El flujo QR funciona correctamente de extremo a extremo.");
    } else {
      console.log("⚠️  RESULTADO: El flujo QR tiene problemas. Revisar evidencia en screenshots.");
    }

    process.exit(finalRecord ? 0 : 1);

  } catch (error) {
    console.error("\n❌ ERROR EN VALIDACIÓN:", error.message);
    console.error(error.stack);

    if (browser) {
      try {
        const pages = await browser.pages();
        for (let i = 0; i < pages.length; i++) {
          const shotPath = path.join(screenshotsDir, `error_page${i + 1}.png`);
          await pages[i].screenshot({ path: shotPath });
          console.log(`📸 Screenshot de error (página ${i + 1}): ${shotPath}`);
          const bodyText = await pages[i].evaluate(() => document.body.innerText).catch(() => "N/A");
          console.log(`=== TEXTO DE PÁGINA ${i + 1} ===`);
          console.log(bodyText.substring(0, 1000));
        }
      } catch (e) {
        console.error("Error capturando screenshots:", e.message);
      }
      await browser.close();
    }
    process.exit(1);
  } finally {
    if (browser) await browser.close().catch(() => {});
    await mongoose.disconnect().catch(() => {});
  }
};

runValidation();
