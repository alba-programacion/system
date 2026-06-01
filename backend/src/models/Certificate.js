const mongoose = require("mongoose");

const CertificateSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    eventId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Event",
        required: true
    },
    nombreDocente: { type: String, required: true },
    nombreCurso: { type: String, required: true },
    claveCurso: { type: String, required: true },
    fechaInicio: { type: String },
    fechaFin: { type: String }
}, { timestamps: true });

// Evitar que se generen múltiples constancias para un mismo usuario y curso
CertificateSchema.index({ userId: 1, eventId: 1 }, { unique: true });

module.exports = mongoose.model("Certificate", CertificateSchema);
