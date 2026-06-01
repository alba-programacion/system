const express = require("express");
const router = express.Router();
const adminController = require("../controllers/adminController");
const evidenciaController = require("../controllers/evidenciaController");

// --- RUTA PARA EL DASHBOARD (CARDS CON DATOS REALES) ---
// Esta ruta es la que usará axios.get('/api/admin/stats') en tu frontend
router.get("/stats", adminController.getDashboardStats);

// --- RUTAS DE USUARIOS ---
// Obtener lista de todos los usuarios
router.get("/users", adminController.getUsers);

// Crear nuevo usuario (Arregla el error 404 al guardar usuario)
router.post("/users", adminController.createUser);

// Activar/Desactivar cuenta de usuario
router.patch("/users/:id/status", adminController.toggleUserStatus);


// --- RUTAS DE EVIDENCIAS ---
router.get("/evidencias", evidenciaController.getEvidencias);
router.patch("/evidencias/:id", evidenciaController.updateEvidenciaStatus);


// --- RUTAS DE EVENTOS ---
router.post("/events", adminController.createEvent); 
router.get("/events", adminController.getEvents);   
router.get("/events/clave/:clave", adminController.getEventByClave);
router.patch("/events/:id", adminController.updateEvent);
router.delete("/events/:id", adminController.deleteEvent);


module.exports = router;