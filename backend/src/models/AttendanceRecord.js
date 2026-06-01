const mongoose = require("mongoose");

const AttendanceRecordSchema = new mongoose.Schema({
    sessionId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "AttendanceSession",
        required: true
    },
    courseId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Event",
        required: true
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    attendanceDate: {
        type: String, // format YYYY-MM-DD
        required: true
    },
    attendanceTime: {
        type: String, // format HH:MM:SS
        required: true
    },
    ipAddress: {
        type: String
    },
    deviceInfo: {
        type: String
    },
    registrationMethod: {
        type: String,
        default: "QR",
        required: true
    }
}, { timestamps: true });

module.exports = mongoose.model("AttendanceRecord", AttendanceRecordSchema);
