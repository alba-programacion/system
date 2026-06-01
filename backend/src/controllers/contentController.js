const Video = require('../models/video');
const Carousel = require('../models/Carousel');

// --- VIDEOS ---
exports.getVideos = async (req, res) => {
    try {
        const videos = await Video.find().sort({ order: 1 });
        res.json(videos);
    } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.upsertVideo = async (req, res) => {
    try {
        const { id } = req.body;
        if (id) {
            const updated = await Video.findByIdAndUpdate(id, req.body, { new: true });
            return res.json(updated);
        }
        const nuevoVideo = new Video(req.body);
        await nuevoVideo.save();
        res.status(201).json(nuevoVideo);
    } catch (err) { res.status(400).json({ error: err.message }); }
};

// --- CARRUSEL ---
exports.getSlides = async (req, res) => {
    try {
        const slides = await Carousel.find().sort({ order: 1 });
        res.json(slides);
    } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.reorderSlides = async (req, res) => {
    try {
        const { orderedIds } = req.body; // Array de IDs en el nuevo orden
        const operations = orderedIds.map((id, index) => ({
            updateOne: {
                filter: { _id: id },
                update: { order: index }
            }
        }));
        await Carousel.bulkWrite(operations);
        res.json({ message: "Orden actualizado" });
    } catch (err) { res.status(500).json({ error: err.message }); }
};