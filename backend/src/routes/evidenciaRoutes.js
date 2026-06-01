const express = require("express");
const router = express.Router();
const evidenciaController = require("../controllers/evidenciaController");
const upload = require("../middlewares/uploadMiddleware"); // Middleware configurado con Multer
const { verificarToken, verificarRol } = require("../middlewares/authMiddleware");

// ==========================================
//        RUTAS PARA EL ALUMNO
// ==========================================

// 1. Subir evidencia (POST /api/evidencias/upload)
router.post("/upload", verificarToken, upload.single("archivo"), evidenciaController.uploadEvidencia);

// 2. Obtener estadísticas del alumno para las Cards (GET /api/evidencias/stats/:alumnoId)
router.get("/stats/:alumnoId", verificarToken, evidenciaController.getAlumnoStats);

// 3. Obtener todas las evidencias de un alumno específico (GET /api/evidencias/alumno/:alumnoId)
router.get("/alumno/:alumnoId", verificarToken, evidenciaController.getEvidenciasAlumno);

// 4. Eliminar una evidencia específica (DELETE /api/evidencias/:id)
router.delete("/:id", verificarToken, evidenciaController.deleteEvidencia);


// ==========================================
//      RUTAS PARA EL ADMINISTRADOR
// ==========================================

// 5. Obtener lista global de evidencias con filtros (GET /api/evidencias)
router.get("/", verificarToken, verificarRol("admin"), evidenciaController.getEvidencias);

// 6. Actualizar estado de una evidencia (PATCH /api/evidencias/:id)
router.patch("/:id", verificarToken, verificarRol("admin"), evidenciaController.updateEvidenciaStatus);

// 7. Ruta alternativa PUT por compatibilidad con el AdminDashboard
router.put("/:id", verificarToken, verificarRol("admin"), evidenciaController.updateEvidenciaStatus);

// 8. Editar archivo y descripción de evidencia (PUT /api/evidencias/edit/:id)
router.put("/edit/:id", verificarToken, upload.single("archivo"), evidenciaController.editEvidencia);

module.exports = router;