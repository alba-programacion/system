const express = require("express");
const app = express();

// Middlewares
app.use(express.json());

// 👇 Importamos el middleware de autenticación
const { verificarToken } = require("./middlewares/authMiddleware");

// Ruta de prueba pública
app.get("/api/test", (req, res) => {
  res.send("Backend funcionando 🚀");
});

// 🔒 Ruta protegida de prueba
app.get("/api/privado", verificarToken, (req, res) => {
  res.json({
    msg: "Ruta protegida funcionando 🔐",
    usuario: req.usuario
  });
});

// Rutas de autenticación
app.use("/api/auth", require("./routes/authRoutes"));

module.exports = app;