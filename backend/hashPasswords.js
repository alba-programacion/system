require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("./src/models/users");

const hashExistingPasswords = async () => {
  await mongoose.connect(process.env.MONGO_URI);
  console.log("✅ Conectado a MongoDB:", mongoose.connection.name);

  const usuarios = await User.find({});
  console.log(`🔍 Usuarios encontrados: ${usuarios.length}`);

  let actualizados = 0;
  let yaHasheados = 0;

  for (const user of usuarios) {
    if (!user.password) {
      console.log(`⚠️  [${user.numeroControl}] Sin contraseña, se omite.`);
      continue;
    }

    // bcrypt hashes always start with "$2b$" or "$2a$"
    const yaEsHash = user.password.startsWith("$2b$") || user.password.startsWith("$2a$");

    if (yaEsHash) {
      console.log(`✔️  [${user.numeroControl}] Ya tiene hash, se omite.`);
      yaHasheados++;
    } else {
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(user.password, salt);
      await user.save();
      console.log(`🔒 [${user.numeroControl}] Contraseña hasheada correctamente.`);
      actualizados++;
    }
  }

  console.log("\n📊 Resumen:");
  console.log(`   Hasheadas ahora:  ${actualizados}`);
  console.log(`   Ya tenían hash:   ${yaHasheados}`);
  console.log("✅ Listo.");
  process.exit(0);
};

hashExistingPasswords().catch((err) => {
  console.error("❌ Error:", err);
  process.exit(1);
});
