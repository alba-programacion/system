require("dotenv").config();
const connectDB = require("./src/config/db");
const app = require("./src/app");
const cors = require("cors");
const express = require("express");

connectDB();

// habilitar CORS para el frontend
app.use(
  cors({
    origin: "http://localhost:5173"
  })
);

// habilitar JSON
app.use(express.json());

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
});
