const Publicidad = require("../models/publicidad");

exports.createPublicidad = async (req, res) => {
  try {
    const nueva = await Publicidad.create(req.body);
    res.json(nueva);
  } catch (err) {
    res.status(500).json({ msg: "Error al crear publicidad", error: err.message });
  }
};

exports.getPublicidad = async (req, res) => {
  try {
    const lista = await Publicidad.find();
    res.json(lista);
  } catch (err) {
    res.status(500).json({ msg: "Error al obtener publicidad", error: err.message });
  }
};

exports.getHeroBackground = async (req, res) => {
  try {
    const hero = await Publicidad.findOne({ titulo: "hero_background" });
    if (!hero) {
      return res.json({ useDefault: true });
    }
    res.json(hero);
  } catch (err) {
    res.status(500).json({ msg: "Error al obtener imagen de héroe", error: err.message });
  }
};

exports.setHeroBackground = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No se subió ninguna imagen" });
    }
    
    const imageUrl = `/uploads/images/${req.file.filename}`;
    
    let hero = await Publicidad.findOne({ titulo: "hero_background" });
    if (hero) {
      const fs = require('fs');
      const path = require('path');
      if (hero.imagenUrl) {
        const oldPath = path.join(__dirname, '../..', hero.imagenUrl);
        if (fs.existsSync(oldPath)) {
          try { fs.unlinkSync(oldPath); } catch (e) { console.error(e); }
        }
      }
      
      hero.imagenUrl = imageUrl;
      await hero.save();
    } else {
      hero = new Publicidad({
        titulo: "hero_background",
        descripcion: "Imagen de fondo del Banner Principal / Héroe",
        imagenUrl: imageUrl
      });
      await hero.save();
    }
    
    res.json(hero);
  } catch (err) {
    console.error("Error setting hero:", err);
    res.status(500).json({ msg: "Error al guardar imagen de héroe", error: err.message });
  }
};

exports.resetHeroBackground = async (req, res) => {
  try {
    const hero = await Publicidad.findOne({ titulo: "hero_background" });
    if (hero) {
      const fs = require('fs');
      const path = require('path');
      if (hero.imagenUrl) {
        const oldPath = path.join(__dirname, '../..', hero.imagenUrl);
        if (fs.existsSync(oldPath)) {
          try { fs.unlinkSync(oldPath); } catch (e) { console.error(e); }
        }
      }
      await Publicidad.deleteOne({ _id: hero._id });
    }
    res.json({ success: true, useDefault: true });
  } catch (err) {
    res.status(500).json({ msg: "Error al reiniciar imagen de héroe", error: err.message });
  }
};
