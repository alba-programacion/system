const User = require("../models/users"); 
const Event = require("../models/Event"); 
const Evidencia = require("../models/Evidencia");
const Video = require("../models/video");
const Publicidad = require("../models/publicidad");
const Carousel = require("../models/Carousel");
const Log = require("../models/Log");

// --- FUNCIÓN ACTUALIZADA PARA LAS CARDS DEL DASHBOARD ---
exports.getDashboardStats = async (req, res) => {
  try {
    // Realizamos todos los conteos en paralelo para optimizar el rendimiento
    const [
      totalUsers, 
      pendingEvidencias, 
      totalEvents, 
      totalVideos, 
      totalAds, 
      totalCarousel, 
      blockedUsers
    ] = await Promise.all([
      User.countDocuments(),
      Evidencia.countDocuments({ estado: "Pendiente" }),
      Event.countDocuments({ type: "event" }), // Contar solo eventos escolares en el contenido público
      Video.countDocuments({ isActive: true }),
      Publicidad.countDocuments(),
      Carousel.countDocuments({ isActive: true }),
      User.countDocuments({ cuenta: "bloqueada" })
    ]);

    res.json({
      users: totalUsers,
      pending: pendingEvidencias,
      // La suma de todo el contenido que ve el alumno en el frontend
      publicContent: totalEvents + totalVideos + totalAds + totalCarousel, 
      toValidate: blockedUsers
    });
  } catch (error) {
    res.status(500).json({ error: "Error al recopilar estadísticas del dashboard" });
  }
};

// --- GESTIÓN DE USUARIOS ---

exports.createUser = async (req, res) => {
  try {
    const { numeroControl, correoInstitucional, nombres, apPaterno, apMaterno, password, roles } = req.body;
    
    const existe = await User.findOne({ $or: [{ numeroControl }, { correoInstitucional }] });
    if (existe) return res.status(400).json({ msg: "El usuario o correo ya existe" });

    const newUser = new User({
      numeroControl,
      correoInstitucional,
      nombres,
      apPaterno,
      apMaterno,
      password, 
      roles,
      cuenta: "activa"
    });

    await newUser.save();
    res.status(201).json({ msg: "Usuario creado con éxito", user: newUser });
  } catch (error) {
    res.status(500).json({ error: "Error al crear el usuario" });
  }
};

exports.getUsers = async (req, res) => {
  try {
    const { search, role, status } = req.query;
    let query = {};
    if (search) {
      query.$or = [
        { nombres: { $regex: search, $options: "i" } },
        { correoInstitucional: { $regex: search, $options: "i" } },
        { numeroControl: { $regex: search, $options: "i" } }
      ];
    }
    if (role && role !== "Todos") query.roles = role;
    if (status && status !== "Todos") query.cuenta = status;

    const users = await User.find(query).sort({ createdAt: -1 });
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: "Error al obtener usuarios" });
  }
};

exports.toggleUserStatus = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ msg: "Usuario no encontrado" });
    user.cuenta = user.cuenta === "bloqueada" ? "activa" : "bloqueada";
    await user.save();
    res.json({ msg: `Estado actualizado a ${user.cuenta}`, user });
  } catch (error) {
    res.status(500).json({ error: "Error al actualizar estado" });
  }
};

// --- GESTIÓN DE EVENTOS ---

exports.createEvent = async (req, res) => {
    try {
        const { title, description, date, courseKey, instructorName, instructor, evidenceUploadEnabled, period, schedule, duration, type } = req.body;
        const newEvent = new Event({ 
            title, 
            description, 
            date, 
            courseKey, 
            instructorName,
            instructor: instructor || null,
            evidenceUploadEnabled: evidenceUploadEnabled || false, 
            period, 
            schedule, 
            duration,
            type: type || "course"
        });
        await newEvent.save();
        res.status(201).json({ message: "Evento creado con éxito", event: newEvent });
    } catch (error) {
        res.status(500).json({ error: "Error al crear el evento" });
    }
};

exports.getEventByClave = async (req, res) => {
    try {
        const { clave } = req.params;
        const event = await Event.findOne({ courseKey: clave });
        if (!event) return res.status(404).json({ error: "Evento no encontrado" });
        res.json(event);
    } catch (error) {
        res.status(500).json({ error: "Error al buscar el evento" });
    }
};

exports.getEvents = async (req, res) => {
    try {
        const { type, instructor, evidenceUploadEnabled } = req.query;
        let query = {};
        if (type) {
            query.type = type;
        }
        if (instructor) {
            query.instructor = instructor;
        }
        if (evidenceUploadEnabled !== undefined) {
            query.evidenceUploadEnabled = evidenceUploadEnabled === 'true';
        }
        const events = await Event.find(query).sort({ createdAt: -1 });
        res.json(events);
    } catch (error) {
        res.status(500).json({ error: "Error al obtener eventos" });
    }
};

exports.updateEvent = async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;
        const updatedEvent = await Event.findByIdAndUpdate(id, updates, { new: true });
        if (!updatedEvent) return res.status(404).json({ error: "Evento no encontrado" });
        res.json({ message: "Evento actualizado con éxito", event: updatedEvent });
    } catch (error) {
        console.error("Error al actualizar evento:", error);
        res.status(500).json({ error: "Error al actualizar el evento" });
    }
};

exports.deleteEvent = async (req, res) => {
    try {
        const { id } = req.params;
        const deletedEvent = await Event.findByIdAndDelete(id);
        if (!deletedEvent) return res.status(404).json({ error: "Evento no encontrado" });
        res.json({ message: "Evento eliminado correctamente" });
    } catch (error) {
        res.status(500).json({ error: "Error al eliminar el evento" });
    }
};

exports.getDashboardStats = async (req, res) => {
  try {
    const [
      totalUsers, 
      pendingEvidencias, 
      totalEvents, 
      totalVideos, 
      totalAds, 
      totalCarousel, 
      blockedUsers,
      recentLogs // Obtenemos actividad reciente
    ] = await Promise.all([
      User.countDocuments(),
      Evidencia.countDocuments({ estado: "Pendiente" }),
      Event.countDocuments({ type: "event" }), // Contar solo eventos escolares en el contenido público
      Video.countDocuments({ isActive: true }),
      Publicidad.countDocuments(),
      Carousel.countDocuments({ isActive: true }),
      User.countDocuments({ cuenta: "bloqueada" }),
      Log.find().sort({ createdAt: -1 }).limit(5) // Traer los últimos 5 movimientos
    ]);

    res.json({
      users: totalUsers,
      pending: pendingEvidencias,
      publicContent: totalEvents + totalVideos + totalAds + totalCarousel, 
      toValidate: blockedUsers,
      recentActivity: recentLogs // Enviamos la lista a la tabla
    });
  } catch (error) {
    res.status(500).json({ error: "Error al recopilar estadísticas del dashboard" });
  }
};