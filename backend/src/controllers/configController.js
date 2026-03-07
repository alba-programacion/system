const SystemConfig = require("../models/systemConfig");

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
    console.error("Error en updateAdmin:", error);
    res.status(500).json({ msg: "Error al actualizar administrador", error: error.message });
  }
};
