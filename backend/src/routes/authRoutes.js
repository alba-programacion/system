const express = require("express");
const router = express.Router();

const { activarCuenta, login, cambiarPassword } = require("../controllers/authController");
const { verificarToken } = require("../middlewares/authMiddleware");

router.post("/activar", activarCuenta);
router.post("/login", login);
router.put("/cambiar-password", verificarToken, cambiarPassword);

module.exports = router;