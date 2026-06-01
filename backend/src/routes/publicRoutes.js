const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { 
  createPublicidad, 
  getPublicidad, 
  getHeroBackground, 
  setHeroBackground, 
  resetHeroBackground 
} = require("../controllers/publicidadController");
const { createVideo, getVideos } = require("../controllers/videoController");

// Configuración de almacenamiento para Multer
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const dir = path.join(__dirname, '../../uploads/images');
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        cb(null, dir); 
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const cleanFileName = file.originalname.replace(/[^a-z0-9.]/gi, '_').toLowerCase();
        cb(null, uniqueSuffix + '-' + cleanFileName);
    }
});

const upload = multer({ 
    storage,
    limits: { fileSize: 50 * 1024 * 1024 } // Límite de 50MB
});

// Endpoints públicos
router.get("/publicidad", getPublicidad);
router.get("/publicidad/hero", getHeroBackground);
router.get("/videos", getVideos);

// Endpoints protegidos para admins
router.post("/publicidad", createPublicidad); 
router.post("/publicidad/hero", upload.single("image"), setHeroBackground);
router.delete("/publicidad/hero", resetHeroBackground);
router.post("/videos", createVideo);

module.exports = router;
