const SystemConfig = require("../models/systemConfig");

const os = require('os');

const getLocalIP = () => {
  const interfaces = os.networkInterfaces();
  let fallback = null;
  
  const isVirtual = (name) => {
    const n = name.toLowerCase();
    return n.includes('virtual') || n.includes('vbox') || n.includes('wsl') || n.includes('hyper-v') || n.includes('host-only') || n.includes('default switch');
  };

  const isPhysical = (name) => {
    const n = name.toLowerCase();
    return n.includes('wi-fi') || n.includes('wlan') || n.includes('ethernet') || n.includes('eth') || n.includes('lan') || n.includes('conexi');
  };

  // 1. Prioritize physical, non-virtual IPv4 adapters
  for (const name of Object.keys(interfaces)) {
    if (isPhysical(name) && !isVirtual(name)) {
      for (const iface of interfaces[name]) {
        if (iface.family === 'IPv4' && !iface.internal) {
          return iface.address;
        }
      }
    }
  }

  // 2. Fallback to any non-virtual IPv4
  for (const name of Object.keys(interfaces)) {
    if (!isVirtual(name)) {
      for (const iface of interfaces[name]) {
        if (iface.family === 'IPv4' && !iface.internal) {
          return iface.address;
        }
      }
    }
  }

  // 3. Fallback to any active non-internal IPv4
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        if (!fallback) fallback = iface.address;
      }
    }
  }

  return fallback || '127.0.0.1';
};

// Obtener la configuración actual (o valores por defecto si no existe)
exports.getConfig = async (req, res) => {
  try {
    let config = await SystemConfig.findOne();
    if (!config) {
      config = new SystemConfig({
        adminActual: "admin@itgam.edu.mx"
      });
      await config.save();
    }
    res.json({
      ...config.toObject(),
      localIP: getLocalIP()
    });
  } catch (error) {
    res.status(500).json({ msg: "Error al obtener la configuración", error: error.message });
  }
};

// Actualizar el administrador actual
exports.updateAdmin = async (req, res) => {
  try {
    const { adminActual } = req.body;

    if (!adminActual) {
      return res.status(400).json({ msg: "Debes proporcionar el correo del nuevo administrador" });
    }

    const config = await SystemConfig.findOne();
    if (!config) {
      // Si no existe documento, lo crea
      const newConfig = new SystemConfig({ adminActual });
      await newConfig.save();
      return res.json({ msg: "Administrador definido correctamente", adminActual });
    }

    // Si existe, lo actualiza
    config.adminActual = adminActual.toLowerCase();
    await config.save();

    res.json({ msg: "Administrador actualizado correctamente", adminActual: config.adminActual });
  } catch (error) {
    res.status(500).json({ msg: "Error al actualizar administrador", error: error.message });
  }
};

// Actualizar la configuración de asistencia
exports.updateAttendanceConfig = async (req, res) => {
  try {
    res.json({ msg: "La funcionalidad de geolocalización GPS ha sido removida completamente." });
  } catch (error) {
    res.status(500).json({ msg: "Error al actualizar configuración de asistencia", error: error.message });
  }
};
