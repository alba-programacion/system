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

    nombres: {
      type: String,
      required: true,
      trim: true
    },

    apPaterno: {
      type: String,
      required: true,
      trim: true
    },

    apMaterno: {
      type: String,
      required: true,
      trim: true
    },

    // 🔐 Será null hasta que el usuario active su cuenta
    password: {
      type: String,
      default: null
    },

    rol: {
      type: String,
      enum: ["admin", "alumno", "profesor", "psicologa"],
      required: true
    },

    cuenta: {
      type: String,
      enum: ["activa", "inactiva"],
      default: "inactiva"
    },

    fechaRegistro: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("User", userSchema);