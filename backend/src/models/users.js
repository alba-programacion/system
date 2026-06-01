const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    numeroControl: { type: String, required: true, unique: true },
    correoInstitucional: { type: String, required: true, unique: true },
    nombres: { type: String, required: true },
    apPaterno: { type: String, required: true },
    apMaterno: { type: String, required: true },
    password: { type: String }, 
    // Actualizamos los roles permitidos
    roles: {
      type: [String],
      enum: ["admin", "alumno", "profesor", "psicologa", "jefe departamento"],
      default: ["alumno"]
    },
    // Añadimos "bloqueada" al enum
    cuenta: {
      type: String,
      enum: ["activa", "inactiva", "bloqueada"],
      default: "activa"
    },
    genero: { 
      type: String, 
      enum: ["Masculino", "Femenino", "Otro", "Hombre", "Mujer"],
      default: "Otro"
    },
    rfc: { type: String, default: "" },
    curp: { type: String, default: "" },
    gradoEstudios: { type: String, default: "" },
    nombreCarrera: { type: String, default: "" },
    datosLaborales: {
      puesto: { type: String, default: "" },
      departamento: { type: String, default: "" },
      institucion: { type: String, default: "" },
      clavePresupuestal: { type: String, default: "" },
      jefeInmediato: { type: String, default: "" },
      telefonoOficial: { type: String, default: "" },
      telefonoExt: { type: String, default: "" },
      horarioLaboral: { type: String, default: "" }
    },
    carrera: { type: mongoose.Schema.Types.ObjectId, ref: "carreras" }
  },
  { 
    // Esto crea automáticamente createdAt y updatedAt (útil para el historial)
    timestamps: true 
  }
);

module.exports = mongoose.model("User", userSchema);