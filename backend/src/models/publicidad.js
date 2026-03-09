const mongoose = require("mongoose");

const publicidadSchema = new mongoose.Schema({
  titulo: { type: String, required: true },
  descripcion: String,
  imagenUrl: String,
  enlace: String,
}, { timestamps: true });

module.exports = mongoose.model("Publicidad", publicidadSchema);
