const express = require("express");
const cors = require("cors");
const { verificarToken } = require("./middlewares/authMiddleware");
const publicRoutes = require("./routes/publicRoutes");


const app = express();

// habilitar CORS para el frontend
app.use(cors({ origin: "http://localhost:5173" }));

// habilitar JSON
app.use(express.json());

// Ruta de prueba pública
app.get("/api/test", (req, res) => {
  res.send("Backend funcionando ");
});

//Ruta protegida de prueba
app.get("/api/privado", verificarToken, (req, res) => {
  res.json({
    msg: "Ruta protegida funcionando ",
    usuario: req.usuario
  });
});

// Rutas de autenticación
app.use("/api/auth", require("./routes/authRoutes"));


//publicidad 
app.use("/api/public", publicRoutes);


module.exports = app;
