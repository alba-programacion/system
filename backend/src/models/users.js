const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    numeroControl: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },
    correoInstitucional: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true
    },
    nombres: { type: String, required: true, trim: true },
    apPaterno: { type: String, required: true, trim: true },
    apMaterno: { type: String, required: true, trim: true },
    password: { type: String, default: null },
    roles: {
      type: [String],
      enum: ["admin", "alumno", "profesor", "psicologa"],
      default: []
    },
    cuenta: {
      type: String,
      enum: ["activa", "inactiva"],
      default: "inactiva"
    },
    carrera: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Carrera",
      default: null
    },
    fechaRegistro: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);
