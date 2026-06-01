require("dotenv").config();
const connectDB = require("./src/config/db");

// 1. Conectar a la base de datos
connectDB();

// 2. Importar la instancia de express desde src/app.js
const app = require("./src/app");

// 3. Encender servidor
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en: http://localhost:${PORT}`);
  console.log(`📂 Archivos estáticos disponibles en: http://localhost:${PORT}/uploads`);
});