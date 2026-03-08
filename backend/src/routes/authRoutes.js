const express = require("express");
const router = express.Router();

const { activarCuenta, login, cambiarPassword, resetPassword } = require("../controllers/authController");
const { updateAdmin } = require("../controllers/configController");
const { verificarToken, verificarRol } = require("../middlewares/authMiddleware");

// Endpoints de autenticación
router.post("/activar", activarCuenta);
router.post("/login", login);
router.put("/cambiar-password", verificarToken, cambiarPassword);
router.post("/reset-password", resetPassword); // 👈 nuevo endpoint

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

// Endpoint protegido para actualizar el administrador actual
router.put("/config/update-admin", verificarToken, verificarRol("admin"), updateAdmin);

module.exports = router;
