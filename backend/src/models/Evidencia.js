const mongoose = require("mongoose");

const evidenciaSchema = new mongoose.Schema(
  {
    // Referencia al ID del usuario (el alumno que sube la evidencia)
    alumno: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "User", 
      required: true 
    },
    // Tipo de evidencia (ej. MOOC, Taller, Inglés)
    tipoEvidencia: { 
      type: String, 
      required: true 
    },
    // Descripción o nombre del curso/taller
    descripcion: { 
      type: String, 
      required: true 
    },
    // URL del archivo almacenado (PDF o Imagen)
    archivoUrl: { 
      type: String, 
      required: true 
    },
    // Nombre original del archivo para mostrar en la interfaz
    archivoNombre: { 
      type: String 
    },
    // Control de estados para el flujo de validación
    estado: {
      type: String,
      enum: ["Pendiente", "En revisión", "Aprobada", "Rechazada"],
      default: "Pendiente"
    },
    // Campo para que el admin deje retroalimentación (especialmente si rechaza)
    observaciones: { 
      type: String, 
      default: "" 
    },
    // Fecha en la que se validó (opcional, para reportes)
    fechaValidacion: { 
      type: Date 
    }
  },
  { 
    // Esto nos dará automáticamente la "Fecha de entrega" (createdAt)
    timestamps: true 
  }
);

module.exports = mongoose.model("Evidencia", evidenciaSchema);