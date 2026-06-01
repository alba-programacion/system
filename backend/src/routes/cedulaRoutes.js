const express = require("express");
const router = express.Router();
const cedulaController = require("../controllers/cedulaController");
const upload = require("../middlewares/uploadMiddleware");
const { verificarToken, verificarRol } = require("../middlewares/authMiddleware");

// Guardar o actualizar cédula
router.post("/", verificarToken, cedulaController.saveCedula);

// Obtener cédula específica de profesor + curso
router.get("/user/:userId/event/:eventId", verificarToken, cedulaController.getCedula);

// Obtener todas las cédulas de un evento específico
router.get("/event/:eventId", verificarToken, cedulaController.getCedulasByEvent);

// Reporte global para administrador (todas las cédulas de inscripción)
router.get("/report", verificarToken, verificarRol("admin"), cedulaController.getAllCedulas);

// Ruta para subir evidencia adjunta a la cédula
router.post("/upload", verificarToken, upload.single("archivo"), (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: "No se subió ningún archivo" });
        }
        res.status(200).json({
            message: "Archivo de evidencia cargado con éxito",
            filePath: req.file.path,
            fileName: req.file.originalname
        });
    } catch (error) {
        console.error("Error al subir archivo de evidencia para cédula:", error);
        res.status(500).json({ error: "Error al procesar el archivo" });
    }
});

module.exports = router;
