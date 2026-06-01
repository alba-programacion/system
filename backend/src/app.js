const express = require("express");
const cors = require("cors");
const path = require("path");

// Importación de Rutas
const authRoutes = require("./routes/authRoutes");
const adminRoutes = require("./routes/adminRoutes");
const videoRoutes = require("./routes/videoRoutes");
const publicRoutes = require("./routes/publicRoutes");
const evidenciaRoutes = require("./routes/evidenciaRoutes"); // Nueva ruta importada
const attendanceRoutes = require("./routes/attendanceRoutes");
const cedulaRoutes = require("./routes/cedulaRoutes");
const certificateRoutes = require("./routes/certificateRoutes");
const surveyRoutes = require("./routes/surveyRoutes");

const app = express();

// Middlewares
app.use(cors({
    origin: (origin, callback) => {
        // Permitir peticiones sin origin (ej. Postman), cualquier localhost o cualquier IP de red privada local
        if (!origin || 
            /^http:\/\/localhost(:\d+)?$/.test(origin) || 
            /^http:\/\/127\.0\.0\.1(:\d+)?$/.test(origin) || 
            /^http:\/\/192\.168\.\d+\.\d+(:\d+)?$/.test(origin) || 
            /^http:\/\/10\.\d+\.\d+\.\d+(:\d+)?$/.test(origin) || 
            /^http:\/\/172\.(1[6-9]|2\d|3[0-1])\.\d+\.\d+(:\d+)?$/.test(origin)) {
            callback(null, true);
        } else {
            callback(new Error("No permitido por CORS"));
        }
    },
    credentials: true
}));

// Configuración de límites para archivos grandes (necesario para PDFs)
app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ limit: '100mb', extended: true }));

// Servir archivos estáticos
// Esto permite que el Admin y el Alumno vean los archivos subidos usando http://localhost:5000/uploads/...
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Registro de Rutas
app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/admin/content", videoRoutes); 
app.use("/api/public", publicRoutes);

// IMPORTANTE: Ruta de evidencias
// Ahora el Alumno podrá usar: http://localhost:5000/api/evidencias/upload
app.use("/api/evidencias", evidenciaRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/cedulas", cedulaRoutes);
app.use("/api/certificates", certificateRoutes);
app.use("/api/surveys", surveyRoutes);

// Manejador 404 (Siempre al final de las rutas, atrapa lo que no coincide con las anteriores)
app.use((req, res) => {
    res.status(404).json({ 
        message: `La ruta ${req.originalUrl} no fue encontrada en el servidor.` 
    });
});

module.exports = app;