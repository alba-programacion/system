const mongoose = require('mongoose');

const videoSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String },
    url: { type: String, required: true }, // Ejemplo: /uploads/videos/123.mp4
    thumbnailUrl: { type: String }, 
    category: { 
        type: String, 
        // Agregamos DESTACADO para que coincida con tu lógica de negocio
        enum: ['ACADÉMICO', 'COMUNIDAD', 'TOUR', 'INNOVACIÓN', 'CULTURA', 'DESTACADO', 'GENERAL'], 
        default: 'DESTACADO' 
    },
    isFeatured: { type: Boolean, default: false }, 
    order: { type: Number, default: 0 }, 
    isActive: { type: Boolean, default: true }, 
    uploadDate: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Video', videoSchema);