const Survey = require("../models/Survey");
const Event = require("../models/Event");
const Cedula = require("../models/Cedula");

exports.submitSurvey = async (req, res) => {
    try {
        const { tipo, eventId, userId, departamento, curso, docente, institucion, facilitador, fechaRealizacion, respuestas, sugerencias } = req.body;

        if (!userId) {
            return res.status(400).json({ error: "userId es requerido" });
        }

        // Validación de privacidad: Solo admin o el mismo usuario
        if (!req.usuario.roles.includes('admin') && req.usuario.id !== userId) {
            return res.status(403).json({ error: "No tienes permiso para enviar una encuesta en nombre de otro usuario" });
        }

        let survey = await Survey.findOne({ tipo, eventId, userId });

        if (survey) {
            survey.departamento = departamento;
            survey.curso = curso;
            survey.docente = docente;
            survey.institucion = institucion;
            survey.facilitador = facilitador;
            survey.fechaRealizacion = fechaRealizacion;
            survey.respuestas = respuestas;
            survey.sugerencias = sugerencias;
            await survey.save();
        } else {
            survey = new Survey({
                tipo, eventId, userId, departamento, curso, docente, institucion, facilitador, fechaRealizacion, respuestas, sugerencias
            });
            await survey.save();
        }

        res.status(200).json({ message: "Encuesta guardada con éxito", survey });
    } catch (error) {
        console.error("Error al guardar encuesta:", error);
        res.status(500).json({ error: "Error interno del servidor" });
    }
};

exports.getSingleSurvey = async (req, res) => {
    try {
        const { userId, eventId, tipo } = req.params;

        // Validación de privacidad: Solo admin, el mismo usuario, o el instructor del evento
        const event = await Event.findById(eventId);
        const isInstructor = event && event.instructor?.toString() === req.usuario.id;
        if (!req.usuario.roles.includes('admin') && req.usuario.id !== userId && !isInstructor) {
            return res.status(403).json({ error: "No tienes permiso para acceder a esta encuesta" });
        }

        const survey = await Survey.findOne({ userId, eventId, tipo });
        res.json(survey);
    } catch (error) {
        console.error("Error al obtener encuesta:", error);
        res.status(500).json({ error: "Error al obtener encuesta" });
    }
};

exports.getSurveysByEvent = async (req, res) => {
    try {
        const { eventId } = req.params;

        // Validación de privacidad: Solo admin o el instructor del evento
        const event = await Event.findById(eventId);
        const isInstructor = event && event.instructor?.toString() === req.usuario.id;
        if (!req.usuario.roles.includes('admin') && !isInstructor) {
            return res.status(403).json({ error: "Solo los administradores o el facilitador del curso pueden ver las encuestas" });
        }

        const surveys = await Survey.find({ eventId }).populate("userId", "nombres apPaterno apMaterno numeroControl");
        res.json(surveys);
    } catch (error) {
        res.status(500).json({ error: "Error al obtener encuestas" });
    }
};

exports.getSurveyReport = async (req, res) => {
    try {
        const { eventId, tipo } = req.params;

        // Validación de privacidad: Solo admin o el instructor del evento
        const event = await Event.findById(eventId);
        const isInstructor = event && event.instructor?.toString() === req.usuario.id;
        if (!req.usuario.roles.includes('admin') && !isInstructor) {
            return res.status(403).json({ error: "Solo los administradores o el facilitador del curso pueden ver el reporte de encuestas" });
        }

        const surveys = await Survey.find({ eventId, tipo });
        
        if (!surveys.length) {
            return res.json({ total: 0, promedios: [], comentarios: [] });
        }

        const totalRespuestas = surveys.length;
        const numPreguntas = surveys[0].respuestas.length;
        const sumas = Array(numPreguntas).fill(0);
        const comentarios = [];

        surveys.forEach(survey => {
            survey.respuestas.forEach((val, idx) => {
                sumas[idx] += val;
            });
            if (survey.sugerencias && survey.sugerencias.trim() !== "") {
                comentarios.push(survey.sugerencias);
            }
        });

        const promedios = sumas.map(suma => (suma / totalRespuestas).toFixed(2));

        res.json({ total: totalRespuestas, promedios, comentarios });
    } catch (error) {
        res.status(500).json({ error: "Error al generar reporte" });
    }
};

exports.getUserSurveys = async (req, res) => {
    try {
        const { userId } = req.params;

        // Validación de privacidad: Solo admin o el propio usuario
        if (!req.usuario.roles.includes('admin') && req.usuario.id !== userId) {
            return res.status(403).json({ error: "No tienes permiso para acceder a las encuestas de otro usuario" });
        }

        const surveys = await Survey.find({ userId }).populate("eventId", "title");
        res.json(surveys);
    } catch (error) {
        res.status(500).json({ error: "Error al obtener encuestas del usuario" });
    }
};
