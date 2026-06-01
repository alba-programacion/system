const express = require("express");
const router = express.Router();

const { activarCuenta, login, cambiarPassword, resetPassword, getUserById, updateUser } = require("../controllers/authController");
const { updateAdmin, getConfig, updateAttendanceConfig } = require("../controllers/configController");
const { verificarToken, verificarRol } = require("../middlewares/authMiddleware");

// Endpoints de autenticación
router.post("/activar", activarCuenta);
router.post("/login", login);
router.put("/cambiar-password", verificarToken, cambiarPassword);
router.post("/reset-password", resetPassword); // 👈 nuevo endpoint
router.get("/user/:id", getUserById);
router.patch("/user/:id", updateUser);

// Endpoint protegido solo para alumnos
router.get("/alumno/dashboard", verificarToken, verificarRol("alumno"), (req, res) => {
  res.json({
    msg: "Bienvenido al dashboard de alumno",
    usuario: req.usuario.numeroControl,
    roles: req.usuario.roles
  });
});

// Endpoint protegido solo para admins
router.get("/admin/panel", verificarToken, verificarRol("admin"), (req, res) => {
  res.json({
    msg: "Bienvenido al panel de administrador",
    usuario: req.usuario.numeroControl,
    roles: req.usuario.roles
  });
});

// Endpoints de configuración protegidos para administradores
router.get("/config", verificarToken, getConfig);
router.put("/config/update-admin", verificarToken, verificarRol("admin"), updateAdmin);
router.put("/config/update-attendance", verificarToken, verificarRol("admin"), updateAttendanceConfig);

module.exports = router;
