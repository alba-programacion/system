const Video = require("../models/video");

exports.createVideo = async (req, res) => {
  try {
    const nuevo = await Video.create(req.body);
    res.json(nuevo);
  } catch (err) {
    res.status(500).json({ msg: "Error al crear video", error: err.message });
  }
};

exports.getVideos = async (req, res) => {
  try {
    const lista = await Video.find();
    res.json(lista);
  } catch (err) {
    res.status(500).json({ msg: "Error al obtener videos", error: err.message });
  }
};
