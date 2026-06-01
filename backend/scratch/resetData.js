require("dotenv").config();
const mongoose = require("mongoose");

// Load models
const Event = require("../src/models/Event");
const Cedula = require("../src/models/Cedula");
const Survey = require("../src/models/Survey");
const Attendance = require("../src/models/Attendance");
const AttendanceRecord = require("../src/models/AttendanceRecord");
const AttendanceSession = require("../src/models/AttendanceSession");
const Evidencia = require("../src/models/Evidencia");
const Certificate = require("../src/models/Certificate");
const Log = require("../src/models/Log");

const reset = async () => {
    try {
        const uri = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/ecad";
        console.log(`Connecting to MongoDB at: ${uri}...`);
        await mongoose.connect(uri);
        console.log("Connected successfully.");

        // Clear interaction collections
        console.log("Deleting all custom course events...");
        await Event.deleteMany({});
        
        console.log("Deleting all submitted Cedulas...");
        await Cedula.deleteMany({});
        
        console.log("Deleting all submitted Surveys...");
        await Survey.deleteMany({});
        
        console.log("Deleting all Attendance logs...");
        await Attendance.deleteMany({});
        
        console.log("Deleting all Attendance records...");
        await AttendanceRecord.deleteMany({});
        
        console.log("Deleting all Attendance sessions...");
        await AttendanceSession.deleteMany({});
        
        console.log("Deleting all uploaded Evidencias...");
        await Evidencia.deleteMany({});
        
        console.log("Deleting all generated Certificates...");
        await Certificate.deleteMany({});
        
        console.log("Deleting all system Logs...");
        await Log.deleteMany({});

        console.log("System has been successfully reset! All interactive documents have been removed.");
        console.log("Users and structural database schemas have been fully preserved.");
        
        process.exit(0);
    } catch (error) {
        console.error("Error during database reset:", error);
        process.exit(1);
    }
};

reset();
