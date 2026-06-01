const mongoose = require("mongoose");

const AttendanceSessionSchema = new mongoose.Schema({
    courseId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Event",
        required: true
    },
    sessionDate: {
        type: String, // format YYYY-MM-DD
        required: true
    },
    startTime: {
        type: String // format HH:MM
    },
    endTime: {
        type: String // format HH:MM
    },
    qrToken: {
        type: String,
        required: true,
        unique: true
    },
    qrStatus: {
        type: String,
        enum: ["active", "expired", "revoked"],
        default: "active",
        required: true
    },
    expiresAt: {
        type: Date,
        required: true
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    }
}, { timestamps: true });

module.exports = mongoose.model("AttendanceSession", AttendanceSessionSchema);
