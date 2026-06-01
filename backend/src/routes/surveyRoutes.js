const express = require("express");
const router = express.Router();
const surveyController = require("../controllers/surveyController");
const { verificarToken, verificarRol } = require("../middlewares/authMiddleware");

// Guardar o actualizar encuesta
router.post("/", verificarToken, surveyController.submitSurvey);

// Obtener encuesta individual por usuario, evento y tipo
router.get("/user/:userId/event/:eventId/type/:tipo", verificarToken, surveyController.getSingleSurvey);

// Obtener encuestas por evento
router.get("/event/:eventId", verificarToken, surveyController.getSurveysByEvent);

// Obtener reporte agregado de encuestas por tipo
router.get("/report/:eventId/tipo/:tipo", verificarToken, surveyController.getSurveyReport);

// Obtener encuestas de usuario
router.get("/user/:userId", verificarToken, surveyController.getUserSurveys);

module.exports = router;

