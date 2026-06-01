const mongoose = require("mongoose");

const CedulaSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    eventId: { type: mongoose.Schema.Types.ObjectId, ref: "Event", required: true },
    personalData: {
        nombres: { type: String },
        apellidos: { type: String },
        genero: { type: String },
        rfc: { type: String },
        curp: { type: String },
        gradoEstudios: { type: String },
        nombreCarrera: { type: String }
    },
    laborData: {
        clavePresupuestal: { type: String },
        jefeInmediato: { type: String },
        telefonoOficial: { type: String },
        telefonoExt: { type: String },
        horarioLaboral: { type: String }
    },
    signature: { type: String }, // Imagen de la firma en base64 (touch/mouse)
    evidenceUrl: { type: String }, // Ruta del archivo de evidencia adjunto
    evidenceName: { type: String }
}, { timestamps: true });

CedulaSchema.index({ userId: 1, eventId: 1 }, { unique: true });

module.exports = mongoose.model("Cedula", CedulaSchema);
