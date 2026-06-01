const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
require("dotenv").config();

const BASE_URL = "http://localhost:5000/api";

const runTest = async () => {
  try {
    console.log("=== STARTING QR ATTENDANCE FLOW E2E INTEGRATION TEST ===");
    console.log("Connecting to MongoDB Atlas...");
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ DB Connected successfully!");

    const User = require("../src/models/users");
    const Event = require("../src/models/Event");
    const Cedula = require("../src/models/Cedula");
    const AttendanceSession = require("../src/models/AttendanceSession");
    const AttendanceRecord = require("../src/models/AttendanceRecord");
    const Attendance = require("../src/models/Attendance");
    const SystemConfig = require("../src/models/systemConfig");

    // 1. Find a course
    const course = await Event.findOne({ type: "course" });
    if (!course) {
      console.error("❌ No course found in DB to test. Make sure seed has run.");
      process.exit(1);
    }
    console.log(`📌 Found Course: "${course.title}" (ID: ${course._id})`);

    // 2. Find the instructor or any active professor
    let professor = await User.findOne({ _id: course.instructor });
    if (!professor) {
      // Fallback to any user with role "profesor"
      professor = await User.findOne({ roles: "profesor", cuenta: "activa" });
    }
    if (!professor) {
      console.error("❌ No active professor found in DB to test.");
      process.exit(1);
    }
    console.log(`📌 Using Professor: "${professor.nombres} ${professor.apPaterno}" (ID: ${professor._id}, Control: ${professor.numeroControl})`);

    // 3. Ensure the professor is enrolled in the course
    let enrollment = await Cedula.findOne({ eventId: course._id, userId: professor._id });
    let createdDummyEnrollment = false;
    if (!enrollment) {
      console.log("⚠️ Professor not enrolled in course. Creating temporary enrollment...");
      enrollment = new Cedula({
        eventId: course._id,
        userId: professor._id,
        personalData: {
          nombres: professor.nombres,
          apPaterno: professor.apPaterno,
          apMaterno: professor.apMaterno || "",
          genero: professor.genero || "Masculino"
        },
        carrera: new mongoose.Types.ObjectId()
      });
      await enrollment.save();
      createdDummyEnrollment = true;
      console.log("✅ Temporary enrollment created.");
    } else {
      console.log("✅ Professor is already enrolled in the course.");
    }

    // 3.5 Find an admin user to act as creator of the session
    const admin = await User.findOne({ roles: "admin" }) || professor;
    console.log(`📌 Using Admin: "${admin.nombres} ${admin.apPaterno}" (ID: ${admin._id}) for createdBy`);

    // 4. Ensure SystemConfig is populated or read its location requirement
    let config = await SystemConfig.findOne();
    if (!config) {
      config = new SystemConfig({
        adminActual: "Test Admin",
        requireLocation: false,
        maxDistance: 100
      });
      await config.save();
    }
    console.log(`📌 SystemConfig - RequireLocation: ${config.requireLocation}, MaxDistance: ${config.maxDistance}m`);

    // 5. Clean up any existing sessions or attendance records for this test run
    await AttendanceRecord.deleteMany({ userId: professor._id, courseId: course._id });
    await AttendanceSession.deleteMany({ courseId: course._id });
    // Also legacy attendance
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date(todayStart);
    todayEnd.setDate(todayEnd.getDate() + 1);
    await Attendance.deleteMany({
      eventId: course._id,
      userId: professor._id,
      createdAt: { $gte: todayStart, $lt: todayEnd }
    });
    console.log("🧹 Cleaned up existing test session and attendance records.");

    // 6. Generate a valid QR Session (Simulates Administrator QR generation)
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 15 * 60 * 1000); // 15 mins expiration
    const qrToken = `test-token-${Date.now()}`;
    
    // Format local date string (YYYY-MM-DD)
    const offset = now.getTimezoneOffset();
    const localNow = new Date(now.getTime() - offset * 60 * 1000);
    const sessionDate = localNow.toISOString().split("T")[0];

    const session = new AttendanceSession({
      courseId: course._id,
      sessionDate,
      startTime: "00:00",
      endTime: "23:59", // Always valid time-range
      expiresAt,
      qrToken,
      qrStatus: "active",
      latitude: config.requireLocation ? 19.432608 : undefined, // CDMX coordinates
      longitude: config.requireLocation ? -99.133209 : undefined,
      createdBy: admin._id
    });
    await session.save();
    console.log(`✅ Attendance session created! Token: "${qrToken}" (Expires at: ${expiresAt.toLocaleTimeString()})`);


    // 7. Generate JWT token for the professor
    const token = jwt.sign(
      { id: professor._id, numeroControl: professor.numeroControl, roles: professor.roles },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );
    console.log("🔑 Generated authentication JWT for professor.");

    // 8. Make the Attendance Registration POST request (Simulates scanned QR)
    console.log("Sending POST /attendance/asistencia/registrar...");
    const regPayload = {
      token: qrToken,
      latitude: config.requireLocation ? 19.432608 : undefined,
      longitude: config.requireLocation ? -99.133209 : undefined,
      deviceInfo: "E2E Integration Test Suite"
    };

    const regRes = await fetch(`${BASE_URL}/attendance/asistencia/registrar`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify(regPayload)
    });

    console.log(`Response status: ${regRes.status}`);
    const regData = await regRes.json();
    console.log("Response data:", regData);

    if (regRes.status !== 201) {
      throw new Error(`Registration failed with status ${regRes.status}`);
    }
    console.log("🎉 Attendance registered successfully through API!");

    // 9. Fetch own records (Simulates professor viewing history table)
    console.log(`Sending GET /attendance/my-records/${course._id}...`);
    const recordsRes = await fetch(`${BASE_URL}/attendance/my-records/${course._id}`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${token}`
      }
    });

    console.log(`Response status: ${recordsRes.status}`);
    const records = await recordsRes.json();
    console.log("My records found in database:");
    console.log(JSON.stringify(records, null, 2));

    if (recordsRes.status !== 200 || !Array.isArray(records) || records.length === 0) {
      throw new Error("Failed to retrieve the registered attendance record through my-records endpoint!");
    }
    console.log("🎉 Attendance history successfully loaded!");

    // 10. Clean up everything to leave the database clean
    console.log("Cleaning up database test documents...");
    await AttendanceRecord.deleteMany({ userId: professor._id, courseId: course._id });
    await AttendanceSession.deleteMany({ courseId: course._id });
    await Attendance.deleteMany({
      eventId: course._id,
      userId: professor._id,
      createdAt: { $gte: todayStart, $lt: todayEnd }
    });
    if (createdDummyEnrollment) {
      await Cedula.deleteOne({ _id: enrollment._id });
      console.log("🧹 Removed temporary enrollment.");
    }
    console.log("🧹 Cleaned up generated test documents successfully.");
    console.log("\n⭐️ INTEGRATION TEST COMPLETED SUCCESSFULLY! E2E QR FLOW WORKS FLAWLESSLY! ⭐️");
    process.exit(0);

  } catch (error) {
    console.error("❌ Test Failed:", error);
    process.exit(1);
  }
};

runTest();
