const Evidencia = require("../models/Evidencia");
const Cedula = require("../models/Cedula");
const Log = require("../models/Log");
const fs = require("fs");
const path = require("path");

// 1. SUBIR EVIDENCIA (Procesa el archivo de Multer)
exports.uploadEvidencia = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: "No se subió ningún archivo" });
        }

        // Extraemos datos desde req.body
        const { usuarioId, tipo, descripcion } = req.body;

        // Validación de privacidad: Solo admin, el propio usuario, o el instructor del curso correspondiente
        if (!req.usuario.roles.includes('admin') && req.usuario.id !== usuarioId) {
            const enrolled = await Cedula.findOne({ userId: usuarioId }).populate("eventId");
            if (!enrolled || !enrolled.eventId || enrolled.eventId.instructor?.toString() !== req.usuario.id) {
                return res.status(403).json({ message: "No tienes permisos para subir evidencias para este usuario" });
            }
        }

        const nuevaEvidencia = new Evidencia({
            alumno: usuarioId, 
            tipoEvidencia: tipo || 'MOOC',
            descripcion: descripcion || `Evidencia subida el ${new Date().toLocaleDateString()}`, 
            archivoUrl: req.file.path, 
            archivoNombre: req.file.originalname, 
            estado: 'Pendiente'
        });

        await nuevaEvidencia.save();

        // Registrar en la Actividad Reciente del Sistema
        await new Log({
            usuario: 'Sistema', 
            accion: `Nueva evidencia: ${tipo || 'MOOC'} - Alumno ID: ${usuarioId}`,
            estado: 'Completado'
        }).save();

        res.status(201).json({ 
            message: 'Evidencia enviada a revisión correctamente', 
            evidencia: nuevaEvidencia 
        });
    } catch (error) {
        console.error("Error detallado en uploadEvidencia:", error);
        res.status(500).json({ message: "Error al procesar la subida", error: error.message });
    }
};

// 2. OBTENER ESTADÍSTICAS PARA CARDS DEL ALUMNO
exports.getAlumnoStats = async (req, res) => {
    try {
        const { alumnoId } = req.params;

        // Validación de privacidad: Solo admin o el propio usuario
        if (!req.usuario.roles.includes('admin') && req.usuario.id !== alumnoId) {
            return res.status(403).json({ message: "No tienes permisos para ver las estadísticas de este usuario" });
        }

        const [aprobadas, pendientes] = await Promise.all([
            Evidencia.countDocuments({ alumno: alumnoId, estado: 'Aprobada' }),
            Evidencia.countDocuments({ alumno: alumnoId, estado: 'Pendiente' })
        ]);

        res.json({
            encuestas: 2, 
            constancias: aprobadas,
            creditos: aprobadas * 1, 
            pendientes: pendientes
        });
    } catch (error) {
        res.status(500).json({ message: "Error al obtener estadísticas", error });
    }
};

// 3. OBTENER EVIDENCIAS DE UN ALUMNO (Para su propia vista)
exports.getEvidenciasAlumno = async (req, res) => {
    try {
        const { alumnoId } = req.params;

        // Validación de privacidad: Solo admin, el propio usuario, o el instructor del curso correspondiente
        if (!req.usuario.roles.includes('admin') && req.usuario.id !== alumnoId) {
            const enrolled = await Cedula.findOne({ userId: alumnoId }).populate("eventId");
            if (!enrolled || !enrolled.eventId || enrolled.eventId.instructor?.toString() !== req.usuario.id) {
                return res.status(403).json({ message: "No tienes permisos para ver las evidencias de este usuario" });
            }
        }

        // Buscamos las evidencias que pertenecen al alumno y las ordenamos por fecha
        const evidencias = await Evidencia.find({ alumno: alumnoId }).sort({ createdAt: -1 });
        res.json(evidencias);
    } catch (error) {
        res.status(500).json({ message: "Error al obtener tus evidencias", error: error.message });
    }
};

// 4. ELIMINAR EVIDENCIA (Borra registro y archivo físico)
exports.deleteEvidencia = async (req, res) => {
    try {
        const { id } = req.params;
        const evidencia = await Evidencia.findById(id);

        if (!evidencia) {
            return res.status(404).json({ message: "Evidencia no encontrada" });
        }

        // Validación de privacidad: Solo admin, el dueño de la evidencia, o el instructor del curso correspondiente
        if (!req.usuario.roles.includes('admin') && evidencia.alumno.toString() !== req.usuario.id) {
            const enrolled = await Cedula.findOne({ userId: evidencia.alumno }).populate("eventId");
            if (!enrolled || !enrolled.eventId || enrolled.eventId.instructor?.toString() !== req.usuario.id) {
                return res.status(403).json({ message: "No tienes permisos para eliminar la evidencia de este usuario" });
            }
        }

        // 1. Intentar borrar el archivo físico del servidor
        const rutaArchivo = path.join(__dirname, "../..", evidencia.archivoUrl);
        if (fs.existsSync(rutaArchivo)) {
            fs.unlinkSync(rutaArchivo);
        }

        // 2. Eliminar de la base de datos
        await Evidencia.findByIdAndDelete(id);

        // 3. Registrar la eliminación en el Log
        await new Log({
            usuario: 'Sistema',
            accion: `Evidencia eliminada - ID: ${id}`,
            estado: 'Completado'
        }).save();

        res.json({ message: "Evidencia eliminada correctamente" });
    } catch (error) {
        console.error("Error al eliminar evidencia:", error);
        res.status(500).json({ message: "Error al eliminar la evidencia", error: error.message });
    }
};

// 5. OBTENER TODAS LAS EVIDENCIAS (Para el Admin)
exports.getEvidencias = async (req, res) => {
    try {
        const { estado, carrera, descripcion } = req.query;
        let query = {};

        if (estado && estado !== 'Todos') query.estado = estado;
        if (descripcion) query.descripcion = { $regex: descripcion, $options: 'i' };

        const evidencias = await Evidencia.find(query)
            .populate({
                path: 'alumno',
                select: 'nombres apPaterno apMaterno numeroControl',
                populate: { path: 'carrera', select: 'nombreCarrera' }
            })
            .sort({ createdAt: -1 });

        let filteredEvidencias = evidencias;
        if (carrera && carrera !== 'Todas') {
            filteredEvidencias = evidencias.filter(ev => 
                ev.alumno?.carrera?.nombreCarrera === carrera
            );
        }

        res.json(filteredEvidencias);
    } catch (error) {
        res.status(500).json({ message: "Error al obtener evidencias", error });
    }
};

// 6. ACTUALIZAR ESTADO (Aprobar/Rechazar con Logs)
exports.updateEvidenciaStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { estado, observaciones } = req.body;

        const evidenciaActualizada = await Evidencia.findByIdAndUpdate(
            id,
            { 
                estado, 
                observaciones,
                fechaValidacion: Date.now() 
            },
            { new: true }
        ).populate('alumno', 'nombres apPaterno');

        if (!evidenciaActualizada) {
            return res.status(404).json({ message: "Evidencia no encontrada" });
        }

        await new Log({
            usuario: 'Admin',
            accion: `${estado} evidencia de ${evidenciaActualizada.alumno.nombres}`,
            estado: 'Completado'
        }).save();

        res.json({ message: `Evidencia ${estado} correctamente`, evidenciaActualizada });
    } catch (error) {
        res.status(500).json({ message: "Error al actualizar estado", error });
    }
};

// 7. EDITAR EVIDENCIA (Reemplaza archivo físico y actualiza estado a Pendiente)
exports.editEvidencia = async (req, res) => {
    try {
        const { id } = req.params;
        const { descripcion } = req.body;

        const evidencia = await Evidencia.findById(id);
        if (!evidencia) {
            return res.status(404).json({ message: "Evidencia no encontrada" });
        }

        // Validación de privacidad: Solo admin, el dueño de la evidencia, o el instructor del curso correspondiente
        if (!req.usuario.roles.includes('admin') && evidencia.alumno.toString() !== req.usuario.id) {
            const enrolled = await Cedula.findOne({ userId: evidencia.alumno }).populate("eventId");
            if (!enrolled || !enrolled.eventId || enrolled.eventId.instructor?.toString() !== req.usuario.id) {
                return res.status(403).json({ message: "No tienes permisos para editar la evidencia de este usuario" });
            }
        }

        // Si se subió un nuevo archivo, borrar el físico anterior
        if (req.file) {
            const rutaArchivoAnterior = path.join(__dirname, "../..", evidencia.archivoUrl);
            if (fs.existsSync(rutaArchivoAnterior)) {
                fs.unlinkSync(rutaArchivoAnterior);
            }
            evidencia.archivoUrl = req.file.path;
            evidencia.archivoNombre = req.file.originalname;
        }

        if (descripcion) {
            evidencia.descripcion = descripcion;
        }

        // Al ser editada, regresa a Pendiente para revisión del Admin
        evidencia.estado = 'Pendiente';
        evidencia.fechaValidacion = null;
        evidencia.observaciones = '';

        await evidencia.save();

        // Registrar en Log
        await new Log({
            usuario: 'Sistema',
            accion: `Evidencia editada/reemplazada - ID: ${id}`,
            estado: 'Completado'
        }).save();

        res.json({ 
            message: "Evidencia editada y enviada a revisión correctamente", 
            evidencia 
        });
    } catch (error) {
        console.error("Error en editEvidencia:", error);
        res.status(500).json({ message: "Error al editar la evidencia", error: error.message });
    }
};