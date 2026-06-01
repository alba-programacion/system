const Certificate = require("../models/Certificate");
const Event = require("../models/Event");
const User = require("../models/users");
const Attendance = require("../models/Attendance");

exports.generateCertificate = async (req, res) => {
    try {
        const { userId, eventId } = req.body;

        // Verificar si ya existe
        const existing = await Certificate.findOne({ userId, eventId });
        if (existing) {
            return res.status(200).json({ message: "La constancia ya estaba generada", certificate: existing });
        }

        // Obtener datos
        const user = await User.findById(userId);
        const event = await Event.findById(eventId);

        if (!user || !event) {
            return res.status(404).json({ error: "Usuario o evento no encontrado" });
        }

        // Verificar asistencia (opcional, dependiendo de las reglas de negocio)
        // const attendanceCount = await Attendance.countDocuments({ eventId, userId });
        // if (attendanceCount < reqParaAprobar) { ... }

        const certificate = new Certificate({
            userId,
            eventId,
            nombreDocente: `${user.nombres} ${user.apPaterno} ${user.apMaterno}`,
            nombreCurso: event.title,
            claveCurso: event.courseKey || "S/C",
            fechaInicio: event.fechaInicio || event.date,
            fechaFin: event.fechaFin || event.date
        });

        await certificate.save();
        res.status(201).json({ message: "Constancia generada con éxito", certificate });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({ message: "La constancia ya existe" });
        }
        res.status(500).json({ error: "Error al generar constancia" });
    }
};

exports.getUserCertificates = async (req, res) => {
    try {
        const { userId } = req.params;
        const certificates = await Certificate.find({ userId }).populate("eventId");
        res.json(certificates);
    } catch (error) {
        res.status(500).json({ error: "Error al obtener constancias" });
    }
};
