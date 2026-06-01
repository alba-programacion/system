const express = require('express');
const router = express.Router();
const Video = require('../models/video');
const Carousel = require('../models/Carousel'); 
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configuración de almacenamiento para Multer
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        // Validación de seguridad para evitar errores de lectura de mimetype
        const isVideo = file.mimetype && file.mimetype.startsWith('video');
        const type = isVideo ? 'videos' : 'images';
        
        // Buscamos la carpeta uploads en la raíz del proyecto
        const dir = path.join(__dirname, '../../uploads/', type);
        
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        cb(null, dir); 
    },
    filename: (req, file, cb) => {
        // Limpiamos el nombre original de espacios y caracteres especiales
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const cleanFileName = file.originalname.replace(/[^a-z0-9.]/gi, '_').toLowerCase();
        cb(null, uniqueSuffix + '-' + cleanFileName);
    }
});

const upload = multer({ 
    storage,
    limits: { fileSize: 100 * 1024 * 1024 } // Límite de 100MB
});

// --- RUTAS GET ---

// Obtener todos los videos (Ruta final: /api/admin/content/)
router.get('/', async (req, res) => {
    try {
        const videos = await Video.find().sort({ uploadDate: -1 });
        res.json(videos);
    } catch (err) {
        res.status(500).json({ message: "Error al obtener videos" });
    }
});

// Obtener slides del carrusel (Ruta final: /api/admin/content/carousel)
router.get('/carousel', async (req, res) => {
    try {
        const slides = await Carousel.find().sort({ order: 1 });
        res.json(slides);
    } catch (err) {
        res.status(500).json({ message: "Error al obtener carrusel" });
    }
});

// --- RUTAS POST ---

// Subir un nuevo video (Ruta final: /api/admin/content/upload)
router.post('/upload', upload.fields([
    { name: 'video', maxCount: 1 }, 
    { name: 'thumbnail', maxCount: 1 }
]), async (req, res) => {
    try {
        // Verificación estricta de archivos recibidos
        if (!req.files || !req.files['video']) {
            return res.status(400).json({ message: "El archivo de video es obligatorio" });
        }

        const videoFile = req.files['video'][0];
        const thumbFile = req.files['thumbnail'] ? req.files['thumbnail'][0] : null;

       // ... dentro de router.post('/upload', ...
const video = new Video({
    title: req.body.title || "Video ITGAM",
    description: req.body.description || "Sin descripción",
    // CAMBIA 'videoUrl' por 'url' para que coincida con tu modelo de Mongoose
    url: `/uploads/videos/${videoFile.filename}`, 
    thumbnailUrl: thumbFile ? `/uploads/images/${thumbFile.filename}` : null,
    category: req.body.category || 'DESTACADO', 
    isActive: true,
    isFeatured: true
});

        await video.save();
        res.status(201).json(video);
    } catch (err) {
        console.error("Error en POST upload:", err);
        res.status(400).json({ message: "Error al procesar la subida", error: err.message });
    }
});

// Subir un nuevo slide al carrusel (Ruta final: /api/admin/content/carousel)
router.post('/carousel', upload.single('image'), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ message: "No se subió imagen" });

        const newSlide = new Carousel({
            title: req.body.title || 'Nuevo Slide ITGAM',
            description: req.body.description || '',
            imageUrl: `/uploads/images/${req.file.filename}`,
            order: req.body.order || 0,
            isActive: true
        });

        await newSlide.save();
        res.status(201).json(newSlide);
    } catch (err) {
        res.status(500).json({ message: "Error al guardar el slide" });
    }
});

// --- RUTAS PUT Y DELETE ---

// Actualizar video (Ruta final: /api/admin/content/:id)
router.put('/:id', async (req, res) => {
    try {
        const { title, description } = req.body;
        const videoActualizado = await Video.findByIdAndUpdate(
            req.params.id,
            { title, description },
            { new: true }
        );
        
        if (!videoActualizado) {
            return res.status(404).json({ message: "Video no encontrado" });
        }
        res.json(videoActualizado);
    } catch (err) {
        res.status(400).json({ message: "Error al actualizar el video", error: err.message });
    }
});

// Eliminar video (Ruta final: /api/admin/content/:id)
router.delete('/:id', async (req, res) => {
    try {
        const video = await Video.findByIdAndDelete(req.params.id);
        
        if (!video) {
            return res.status(404).json({ message: "Video no encontrado" });
        }
        
        // Borrado físico de archivos
        if (video.videoUrl) {
            const videoPath = path.join(__dirname, '../../', video.videoUrl);
            if (fs.existsSync(videoPath)) fs.unlinkSync(videoPath);
        }

        if (video.thumbnailUrl) {
            const thumbPath = path.join(__dirname, '../../', video.thumbnailUrl);
            if (fs.existsSync(thumbPath)) fs.unlinkSync(thumbPath);
        }

        res.status(200).json({ message: "Video eliminado correctamente" });
    } catch (err) {
        res.status(500).json({ message: "Error al eliminar", error: err.message });
    }
});



// --- RUTA PARA ELIMINAR SLIDE DEL CARRUSEL ---
// Ruta final: DELETE /api/admin/content/carousel/:id
router.delete('/carousel/:id', async (req, res) => {
    try {
        const slide = await Carousel.findByIdAndDelete(req.params.id);
        
        if (!slide) {
            return res.status(404).json({ message: "Slide no encontrado" });
        }
        
        // Borrado físico de la imagen en la carpeta uploads
        if (slide.imageUrl) {
            const imagePath = path.join(__dirname, '../../', slide.imageUrl);
            if (fs.existsSync(imagePath)) {
                fs.unlinkSync(imagePath);
            }
        }

        res.status(200).json({ message: "Slide eliminado correctamente" });
    } catch (err) {
        console.error("Error al eliminar slide:", err);
        res.status(500).json({ message: "Error al eliminar el slide", error: err.message });
    }
});

module.exports = router;