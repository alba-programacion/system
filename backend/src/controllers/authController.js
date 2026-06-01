const mongoose = require("mongoose");
const User = require("../models/users");
const SystemConfig = require("../models/systemConfig");
const Carrera = require("../models/carreras");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

// ================================
// ACTIVAR CUENTA
// ================================
exports.activarCuenta = async (req, res) => {
  try {
    const { numeroControl, correoInstitucional, password, carrera } = req.body;

    const usuario = await User.findOne({ numeroControl });
    if (!usuario) return res.status(404).json({ msg: "Usuario no encontrado" });
    if (usuario.cuenta === "activa") return res.status(400).json({ msg: "La cuenta ya está activa" });

    // Limpiamos el correo para evitar espacios accidentales
    const correo = correoInstitucional.trim().toLowerCase();
    let rolAsignado = "";

    // REGLAS DE ROLES
    if (/^\d{9}$/.test(numeroControl)) {
      rolAsignado = "alumno";
    } 
    else if (/^\d{3}$/.test(numeroControl)) {
      // 1. Prioridad: ADMIN (Correo exacto o que empiece con admin@)
      if (correo.startsWith("admin@")) {
        rolAsignado = "admin";
      } 
      // 2. Prioridad: PSICÓLOGA
      else if (correo.startsWith("psicologa@")) {
        rolAsignado = "psicologa";
      } 
      // 3. Todo lo demás con 3 dígitos es PROFESOR
      else {
        rolAsignado = "profesor";
      }
    } 
    else {
      return res.status(400).json({ msg: "Formato de número de control inválido" });
    }

    // Encriptar y Guardar
    const salt = await bcrypt.genSalt(10);
    usuario.password = await bcrypt.hash(password, salt);
    usuario.roles = [rolAsignado];
    usuario.cuenta = "activa";
    usuario.correoInstitucional = correo;

    if (rolAsignado === "alumno") {
      const carreraDoc = await Carrera.findOne({ nombreCarrera: carrera });
      if (!carreraDoc) return res.status(400).json({ msg: "Carrera no válida" });
      usuario.carrera = carreraDoc._id;
    }

    // Normalizar género en caso de valores heredados inválidos en la base de datos
    const validGeneros = ["Masculino", "Femenino", "Otro"];
    if (usuario.genero && !validGeneros.includes(usuario.genero)) {
      const gLower = usuario.genero.toLowerCase();
      if (gLower === "hombre") {
        usuario.genero = "Masculino";
      } else if (gLower === "mujer") {
        usuario.genero = "Femenino";
      } else {
        usuario.genero = "Otro";
      }
    }

    await usuario.save();

    res.json({
      msg: "Cuenta activada correctamente",
      roles: usuario.roles,
      // Corregimos el redirectTo dinámico
      redirectTo: `/${rolAsignado}/dashboard`,
      nombreCompleto: `${usuario.nombres} ${usuario.apPaterno}`
    });

  } catch (error) {
    res.status(500).json({ msg: "Error al activar", error: error.message });
  }
};

// ================================
// LOGIN (Corregido el direccionamiento)
// ================================
exports.login = async (req, res) => {
  try {
    const { numeroControl, password } = req.body;
    const usuario = await User.findOne({ numeroControl });

    if (!usuario) return res.status(404).json({ msg: "Usuario no encontrado" });
    if (usuario.cuenta !== "activa") return res.status(400).json({ msg: "Cuenta inactiva" });

    const esMatch = await bcrypt.compare(password, usuario.password);
    if (!esMatch) return res.status(400).json({ msg: "Contraseña incorrecta" });

    const token = jwt.sign(
      { id: usuario._id, numeroControl: usuario.numeroControl, roles: usuario.roles },
      process.env.JWT_SECRET,
      { expiresIn: "8h" }
    );

    // IMPORTANTE: Tomamos el rol que ya está guardado en la DB
    const rolPrincipal = usuario.roles[0]; 
    
    // Simplificamos la lógica de redirección
    const redirectTo = `/${rolPrincipal}/dashboard`;

    res.json({
  token,
  roles: usuario.roles,
  redirectTo,
  nombreCompleto: `${usuario.nombres} ${usuario.apPaterno}`,
  user: {
    _id: usuario._id,
    numeroControl: usuario.numeroControl,
    correoInstitucional: usuario.correoInstitucional,
    nombres: usuario.nombres,
    apPaterno: usuario.apPaterno,
    apMaterno: usuario.apMaterno
  }
});


  } catch (error) {
    res.status(500).json({ msg: "Error en login", error: error.message });
  }
};

// ================================
// CAMBIAR PASSWORD
// ================================
exports.cambiarPassword = async (req, res) => {
  try {
    const { passwordActual, passwordNueva } = req.body;

    const usuario = await User.findOne({
      numeroControl: req.usuario.numeroControl
    });

    if (!usuario) {
      return res.status(404).json({ msg: "Usuario no encontrado" });
    }

    const esMatch = await bcrypt.compare(passwordActual, usuario.password);

    if (!esMatch) {
      return res.status(400).json({
        msg: "Contraseña actual incorrecta"
      });
    }

    const salt = await bcrypt.genSalt(10);
    usuario.password = await bcrypt.hash(passwordNueva, salt);

    await usuario.save();

    res.json({
      msg: "Contraseña actualizada correctamente"
    });

  } catch (error) {
    res.status(500).json({
      msg: "Error del servidor",
      error: error.message
    });
  }
};

// ================================
// RESET PASSWORD
// ================================
exports.resetPassword = async (req, res) => {
  try {
    const { numeroControl, correoInstitucional, newPassword } = req.body;

    const usuario = await User.findOne({
      numeroControl,
      correoInstitucional: correoInstitucional.toLowerCase().trim()
    });

    if (!usuario) {
      return res.status(404).json({
        msg: "Usuario no encontrado"
      });
    }

    const salt = await bcrypt.genSalt(10);
    usuario.password = await bcrypt.hash(newPassword, salt);

    await usuario.save();

    res.json({
      msg: "Contraseña actualizada correctamente"
    });

  } catch (error) {
    res.status(500).json({
      msg: "Error del servidor",
      error: error.message
    });
  }
};

exports.getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ msg: "Usuario no encontrado" });
    res.json(user);
  } catch (error) {
    res.status(500).json({ msg: "Error al obtener usuario", error: error.message });
  }
};

exports.updateUser = async (req, res) => {
  try {
    const { genero, datosLaborales, rfc, curp, gradoEstudios, nombreCarrera } = req.body;
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { $set: { genero, datosLaborales, rfc, curp, gradoEstudios, nombreCarrera } },
      { new: true }
    );
    if (!user) return res.status(404).json({ msg: "Usuario no encontrado" });
    res.json(user);
  } catch (error) {
    res.status(500).json({ msg: "Error al actualizar usuario", error: error.message });
  }
};