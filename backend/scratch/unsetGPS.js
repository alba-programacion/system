require("dotenv").config();
const mongoose = require("mongoose");
const connectDB = require("../src/config/db");
const SystemConfig = require("../src/models/systemConfig");

async function run() {
  try {
    await connectDB();
    console.log("Connected to MongoDB");

    // Clear GPS fields from SystemConfig collection
    const res = await mongoose.connection.db.collection("systemconfigs").updateMany(
      {},
      { $unset: { requireLocation: "", maxDistance: "" } }
    );
    console.log("SystemConfig collection updated:", res);

    // Clear GPS fields from AttendanceSession collection
    const resSessions = await mongoose.connection.db.collection("attendancesessions").updateMany(
      {},
      { $unset: { latitude: "", longitude: "" } }
    );
    console.log("AttendanceSession collection updated:", resSessions);

    // Clear GPS fields from AttendanceRecord collection
    const resRecords = await mongoose.connection.db.collection("attendancerecords").updateMany(
      {},
      { $unset: { geolocation: "" } }
    );
    console.log("AttendanceRecord collection updated:", resRecords);

    console.log("GPS fields removed from DB successfully.");
  } catch (err) {
    console.error("Error during unset:", err);
  } finally {
    await mongoose.connection.close();
    process.exit(0);
  }
}

run();
