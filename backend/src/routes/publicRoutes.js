const express = require("express");
const router = express.Router();
const { createPublicidad, getPublicidad } = require("../controllers/publicidadController");
const { createVideo, getVideos } = require("../controllers/videoController");

// Endpoints públicos
router.get("/publicidad", getPublicidad);
router.get("/videos", getVideos);

// Endpoints protegidos para admins
router.post("/publicidad", createPublicidad); 
router.post("/videos", createVideo);

module.exports = router;
