const mongoose = require("mongoose");

const carreraSchema = new mongoose.Schema({
  nombreCarrera: { type: String, required: true, unique: true },
  descripcion: String,
  perfilIngreso: String,
  perfilEgreso: String,
  campoLaboral: String
}, { timestamps: true });

module.exports = mongoose.model("Carrera", carreraSchema);
