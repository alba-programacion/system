const mongoose = require("mongoose");

const AttendanceSchema = new mongoose.Schema({
    eventId: { type: mongoose.Schema.Types.ObjectId, ref: "Event", required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    date: { type: Date, default: Date.now },
    status: { type: String, enum: ["Presente", "Ausente"], default: "Presente" }
}, { timestamps: true });

module.exports = mongoose.model("Attendance", AttendanceSchema);
