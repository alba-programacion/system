const mongoose = require("mongoose");
const User = require("../models/users");
const SystemConfig = require("../models/systemConfig"); 
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

exports.activarCuenta = async (req, res) => {
  try {
    const { numeroControl, correoInstitucional, password, carreraId } = req.body;

    const usuario = await User.findOne({ numeroControl });
    if (!usuario) return res.status(404).json({ msg: "Usuario no encontrado" });
    if (usuario.cuenta === "activa") {
      return res.status(400).json({ msg: "La cuenta ya está activa" });
    }

    // Consultar adminActual desde systemConfig
    const config = await SystemConfig.findOne();
    const adminActual = config ? config.adminActual.toLowerCase() : null;

    // Detectar rol
    let rolAsignado;
    if (/^\d{9}$/.test(numeroControl) && usuario.correoInstitucional.startsWith("L")) {
      rolAsignado = "alumno";
    } else if (/^[1-6]{3}$/.test(numeroControl)) {
      const correo = correoInstitucional.toLowerCase();

      if (correo.includes("psicologa")) {
        rolAsignado = "psicologa";
      } else if (correo === adminActual) {
        rolAsignado = "admin"; 
      } else {
        rolAsignado = "profesor";
      }
    } else {
      return res.status(400).json({ msg: "Formato de número de control inválido" });
    }

    // Encriptar contraseña
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    usuario.password = hashedPassword;
    usuario.roles = [rolAsignado];
    usuario.cuenta = "activa";
    usuario.correoInstitucional = correoInstitucional;

    if (rolAsignado === "alumno") {
      if (!carreraId) {
        return res.status(400).json({ msg: "Debes seleccionar tu carrera" });
      }
      usuario.carrera = new mongoose.Types.ObjectId(carreraId);
    } else {
      usuario.carrera = null;
    }

    await usuario.save();

    res.json({
      msg: "Cuenta activada correctamente",
      roles: usuario.roles,
      correoInstitucional: usuario.correoInstitucional
    });
  } catch (error) {
    console.error("Error en activarCuenta:", error);
    res.status(500).json({ msg: "Error al activar cuenta", error: error.message });
  }
};

// LOGIN
exports.login = async (req, res) => {
  try {
    const { numeroControl, password } = req.body;

    const usuario = await User.findOne({ numeroControl });
    if (!usuario) return res.status(404).json({ msg: "Usuario no encontrado" });
    if (usuario.cuenta !== "activa") {
      return res.status(400).json({ msg: "La cuenta aún no está activada" });
    }

    const esMatch = await bcrypt.compare(password, usuario.password);
    if (!esMatch) {
      return res.status(400).json({ msg: "Contraseña incorrecta" });
    }

    const token = jwt.sign(
      { numeroControl: usuario.numeroControl, roles: usuario.roles },
      process.env.JWT_SECRET,
      { expiresIn: "8h" }
    );

    res.json({ msg: "Login correcto", roles: usuario.roles, token });
  } catch (error) {
    console.error("Error en login:", error);
    res.status(500).json({ msg: "Error en login", error: error.message });
  }
};

// CAMBIAR CONTRASEÑA
exports.cambiarPassword = async (req, res) => {
  try {
    const { passwordActual, passwordNueva } = req.body;

    const usuario = await User.findOne({ numeroControl: req.usuario.numeroControl });
    if (!usuario) return res.status(404).json({ msg: "Usuario no encontrado" });

    const esMatch = await bcrypt.compare(passwordActual, usuario.password);
    if (!esMatch) return res.status(400).json({ msg: "Contraseña actual incorrecta" });

    const salt = await bcrypt.genSalt(10);
    const passwordEncriptada = await bcrypt.hash(passwordNueva, salt);

    await User.findOneAndUpdate(
      { numeroControl: req.usuario.numeroControl },
      { password: passwordEncriptada },
      { new: true }
    );

    res.json({ msg: "Contraseña actualizada correctamente" });
  } catch (error) {
    console.error("Error en cambiarPassword:", error);
    res.status(500).json({ msg: "Error del servidor", error: error.message });
  }
};
