const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Usar ruta absoluta basada en la ubicación de este archivo (__dirname es src/middlewares)
// Esto asegura que la ruta siempre sea backend/uploads/evidencias
const uploadDir = path.join(__dirname, '../../uploads/evidencias');

// Asegurar que la carpeta de destino existe
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        // Reemplazar espacios por guiones en el nombre original para evitar problemas en la URL
        const safeName = file.originalname.replace(/\s+/g, '-');
        // Formato: timestamp-nombreseguro
        cb(null, `${Date.now()}-${safeName}`);
    }
});

// Filtro para aceptar solo PDF e imágenes
const fileFilter = (req, file, cb) => {
    const filetypes = /jpeg|jpg|png|pdf/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);

    if (mimetype && extname) {
        return cb(null, true);
    }
    cb(new Error('Solo se permiten imágenes (JPG, PNG) y archivos PDF'));
};

const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB límite
    fileFilter: fileFilter
});

module.exports = upload;