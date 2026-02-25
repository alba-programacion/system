const User = require("../models/user");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken"); 


// ACTIVAR CUENTA
exports.activarCuenta = async (req, res) => {
  try {
    const { numeroControl, password } = req.body;

    // 1️⃣ Buscar usuario precargado
    const usuario = await User.findOne({ numeroControl });

    // ❌ No existe
    if (!usuario) {
      return res.status(404).json({
        msg: "No estás registrado en el sistema"
      });
    }

    // ❌ Ya tiene password
    if (usuario.password) {
      return res.status(400).json({
        msg: "Cuenta ya activada"
      });
    }

    // ❌ Cuenta deshabilitada manualmente
    if (usuario.cuenta === "inactiva" && usuario.password !== null) {
      return res.status(403).json({
        msg: "Cuenta deshabilitada por administración"
      });
    }

    // ✅ Hashear password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    usuario.password = hashedPassword;
    usuario.cuenta = "activa";

    await usuario.save();

    res.status(200).json({
      msg: "Cuenta activada correctamente"
    });

  } catch (error) {
    res.status(500).json({ msg: "Error del servidor", error });
  }
};

// LOGIN
exports.login = async (req, res) => {
  try {
    const { numeroControl, password } = req.body;

    const usuario = await User.findOne({ numeroControl });

    // ❌ No existe
    if (!usuario) {
      return res.status(404).json({ msg: "Usuario no encontrado" });
    }

    // ❌ Cuenta no activada
    if (!usuario.password) {
      return res.status(400).json({ msg: "Cuenta no activada" });
    }

    // ❌ Cuenta desactivada por admin
    if (usuario.cuenta === "inactiva") {
      return res.status(403).json({ msg: "Cuenta desactivada" });
    }

    // 🔐 Comparar password
    const esValido = await bcrypt.compare(password, usuario.password);

    if (!esValido) {
      return res.status(400).json({ msg: "Credenciales incorrectas" });
    }

    // 🎟 Crear token
    const token = jwt.sign(
      {
        id: usuario._id,
        rol: usuario.rol,
        numeroControl: usuario.numeroControl
      },
      process.env.JWT_SECRET,
      { expiresIn: "8h" }
    );

    res.json({
      msg: "Login correcto",
      token
    });

  } catch (error) {
    res.status(500).json({ msg: "Error del servidor", error });
  }
};
//cambiar contraseña 
exports.cambiarPassword = async (req, res) => {
  try {
    const { passwordActual, passwordNueva } = req.body;

    const usuario = await User.findById(req.usuario.id);

    if (!usuario) {
      return res.status(404).json({ msg: "Usuario no encontrado" });
    }

    const esValido = await bcrypt.compare(passwordActual, usuario.password);

    if (!esValido) {
      return res.status(400).json({ msg: "Password actual incorrecto" });
    }

    const salt = await bcrypt.genSalt(10);
    usuario.password = await bcrypt.hash(passwordNueva, salt);

    await usuario.save();

    res.json({ msg: "Contraseña actualizada correctamente" });

  } catch (error) {
   
res.status(500).json({ msg: "Error del servidor", error: error.message });
  }
};