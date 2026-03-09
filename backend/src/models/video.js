const mongoose = require("mongoose");

const videoSchema = new mongoose.Schema({
  titulo: { type: String, required: true },
  descripcion: String,
  url: { type: String, required: true },
}, { timestamps: true });

module.exports = mongoose.model("Video", videoSchema);
