const mongoose = require("mongoose");

const SurveySchema = new mongoose.Schema({
    tipo: {
        type: String,
        enum: ["eficacia_estudiante", "eficacia_profesor", "opinion"],
        required: true
    },
    eventId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Event"
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    departamento: { type: String },
    curso: { type: String },
    docente: { type: String }, // Instructor evaluado (para eficacia_profesor)
    institucion: { type: String }, // Para opinión
    facilitador: { type: String }, // Para opinión
    fechaRealizacion: { type: String }, // Para opinión
    respuestas: {
        type: [Number], // Arreglo de valores del 1 al 5
        required: true
    },
    sugerencias: { type: String } // Para eficacia_estudiante y opinion
}, { timestamps: true });

module.exports = mongoose.model("Survey", SurveySchema);
