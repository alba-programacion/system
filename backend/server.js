require("dotenv").config();
const express = require("express");
const connectDB = require("./src/config/db");

const app = express();

connectDB();

app.get("/", (req, res) => {
  res.send("API SI-ECAD funcionando");
});

app.listen(process.env.PORT, () => {
  console.log(`Servidor corriendo en puerto ${process.env.PORT}`);
});
