const express = require("express");
const router = express.Router();
const attendanceController = require("../controllers/attendanceController");
const { verificarToken, verificarRol } = require("../middlewares/authMiddleware");

// Legacy endpoints (Secure)
router.post("/register", verificarToken, verificarRol("admin"), attendanceController.registerAttendance);
router.get("/report/:eventId", verificarToken, attendanceController.getAttendanceReport);

// QR Attendance Session management (Admin only)
router.post("/session", verificarToken, verificarRol("admin"), attendanceController.createSession);
router.post("/session/:id/regenerate", verificarToken, verificarRol("admin"), attendanceController.regenerateToken);
router.post("/session/:id/cancel", verificarToken, verificarRol("admin"), attendanceController.cancelSession);
router.get("/session/history/:courseId", verificarToken, attendanceController.getCourseSessions);
router.get("/session/:id/attendees", verificarToken, verificarRol("admin"), attendanceController.getSessionAttendees);

// QR Attendance flow for Teachers
router.get("/asistencia/:token", verificarToken, attendanceController.getSessionByToken);
router.post("/asistencia/registrar", verificarToken, verificarRol("profesor"), attendanceController.registerQRAttendance);
router.get("/my-records/:courseId", verificarToken, attendanceController.getMyAttendanceRecords);

module.exports = router;
