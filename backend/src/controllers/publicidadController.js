const Publicidad = require("../models/publicidad");

exports.createPublicidad = async (req, res) => {
  try {
    const nueva = await Publicidad.create(req.body);
    res.json(nueva);
  } catch (err) {
    res.status(500).json({ msg: "Error al crear publicidad", error: err.message });
  }
};

exports.getPublicidad = async (req, res) => {
  try {
    const lista = await Publicidad.find();
    res.json(lista);
  } catch (err) {
    res.status(500).json({ msg: "Error al obtener publicidad", error: err.message });
  }
};
