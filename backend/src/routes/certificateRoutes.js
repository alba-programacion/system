const express = require("express");
const router = express.Router();
const certificateController = require("../controllers/certificateController");

// Generar constancia de acreditación para docente
router.post("/generate", certificateController.generateCertificate);

// Obtener todas las constancias de un docente específico
router.get("/user/:userId", certificateController.getUserCertificates);

module.exports = router;
