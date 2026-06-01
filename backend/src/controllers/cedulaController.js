const Cedula = require("../models/Cedula");
const User = require("../models/users");
const Event = require("../models/Event");
const Log = require("../models/Log");

exports.saveCedula = async (req, res) => {
    try {
        const { userId, eventId, personalData, laborData, signature, evidenceUrl, evidenceName } = req.body;

        if (!userId || !eventId) {
            return res.status(400).json({ error: "userId y eventId son requeridos" });
        }

        // Validación de privacidad: Solo admin, el propio usuario, o el instructor del curso
        const eventObj = await Event.findById(eventId);
        const isInstructor = eventObj && eventObj.instructor?.toString() === req.usuario.id;
        if (!req.usuario.roles.includes('admin') && req.usuario.id !== userId && !isInstructor) {
            return res.status(403).json({ error: "No tienes permisos para registrar o modificar esta cédula" });
        }

        // Buscar si ya existe
        let cedula = await Cedula.findOne({ userId, eventId });

        if (cedula) {
            cedula.personalData = personalData;
            cedula.laborData = laborData;
            if (signature) cedula.signature = signature;
            if (evidenceUrl) cedula.evidenceUrl = evidenceUrl;
            if (evidenceName) cedula.evidenceName = evidenceName;
            await cedula.save();
        } else {
            cedula = new Cedula({
                userId,
                eventId,
                personalData,
                laborData,
                signature,
                evidenceUrl,
                evidenceName
            });
            await cedula.save();
        }

        // Adicionalmente, actualizar el perfil del usuario con estos datos para consistencia
        if (personalData || laborData) {
            const userUpdate = {};
            if (personalData) {
                if (personalData.rfc) userUpdate.rfc = personalData.rfc;
                if (personalData.curp) userUpdate.curp = personalData.curp;
                if (personalData.gradoEstudios) userUpdate.gradoEstudios = personalData.gradoEstudios;
                if (personalData.nombreCarrera) userUpdate.nombreCarrera = personalData.nombreCarrera;
                if (personalData.genero) userUpdate.genero = personalData.genero;
            }
            if (laborData) {
                userUpdate.datosLaborales = {
                    clavePresupuestal: laborData.clavePresupuestal || "",
                    jefeInmediato: laborData.jefeInmediato || "",
                    telefonoOficial: laborData.telefonoOficial || "",
                    telefonoExt: laborData.telefonoExt || "",
                    horarioLaboral: laborData.horarioLaboral || ""
                };
            }
            await User.findByIdAndUpdate(userId, userUpdate);
        }

        // Guardar logs de actividad
        await new Log({
            usuario: "Sistema",
            accion: `Cédula de Inscripción guardada/actualizada - Docente ID: ${userId}`,
            estado: "Completado"
        }).save();

        res.status(200).json({ message: "Cédula guardada exitosamente", cedula });
    } catch (error) {
        console.error("Error al guardar cédula:", error);
        res.status(500).json({ error: "Error al procesar el guardado de la cédula" });
    }
};

exports.getCedula = async (req, res) => {
    try {
        const { userId, eventId } = req.params;

        // Validación de privacidad: Solo admin, el propio usuario, o el instructor del curso
        const eventObj = await Event.findById(eventId);
        const isInstructor = eventObj && eventObj.instructor?.toString() === req.usuario.id;
        if (!req.usuario.roles.includes('admin') && req.usuario.id !== userId && !isInstructor) {
            return res.status(403).json({ error: "No tienes permisos para acceder a esta cédula" });
        }

        const cedula = await Cedula.findOne({ userId, eventId });
        if (!cedula) {
            return res.status(404).json({ message: "Cédula no encontrada" });
        }
        res.json(cedula);
    } catch (error) {
        console.error("Error al obtener cédula:", error);
        res.status(500).json({ error: "Error al obtener la cédula" });
    }
};

exports.getAllCedulas = async (req, res) => {
    try {
        const cedulas = await Cedula.find({})
            .populate("userId", "nombres apPaterno apMaterno genero correoInstitucional")
            .populate("eventId", "title courseKey instructorName period schedule duration date");
        res.json(cedulas);
    } catch (error) {
        console.error("Error al obtener reporte global de cédulas:", error);
        res.status(500).json({ error: "Error al generar el reporte" });
    }
};

exports.getCedulasByEvent = async (req, res) => {
    try {
        const { eventId } = req.params;

        // Validación de privacidad: Solo admin o el instructor del curso
        const eventObj = await Event.findById(eventId);
        const isInstructor = eventObj && eventObj.instructor?.toString() === req.usuario.id;
        if (!req.usuario.roles.includes('admin') && !isInstructor) {
            return res.status(403).json({ error: "No tienes permisos para ver las cédulas de este evento" });
        }

        const cedulas = await Cedula.find({ eventId })
            .populate("userId", "nombres apPaterno apMaterno genero correoInstitucional numeroControl");
        res.json(cedulas);
    } catch (error) {
        console.error("Error al obtener cédulas por evento:", error);
        res.status(500).json({ error: "Error al obtener cédulas por evento" });
    }
};
