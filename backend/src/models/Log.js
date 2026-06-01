const mongoose = require('mongoose');

const logSchema = new mongoose.Schema({
    usuario: { type: String, default: 'Sistema' },
    accion: { type: String, required: true },
    estado: { type: String, default: 'Completado' },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Log', logSchema);