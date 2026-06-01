const mongoose = require("mongoose");

const systemConfigSchema = new mongoose.Schema({
  adminActual: {
    type: String,
    required: true
  }
});

module.exports = mongoose.model("SystemConfig", systemConfigSchema);


