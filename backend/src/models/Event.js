const mongoose = require("mongoose");

const EventSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String },
    date: { type: String, required: true }, // Guardamos como string para manejar formatos como "15 OCT"
    courseKey: { type: String, unique: true, sparse: true },
    instructorName: { type: String },
    instructor: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    evidenceUploadEnabled: { type: Boolean, default: false },
    period: { type: String },
    schedule: { type: String },
    duration: { type: String },
    type: { type: String, enum: ["course", "event"], default: "course" },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Event", EventSchema);