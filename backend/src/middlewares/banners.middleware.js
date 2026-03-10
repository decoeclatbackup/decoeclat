import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Directorio para banners
const bannersDir = './uploads/banners';

// Crear carpeta si no existe
if (!fs.existsSync(bannersDir)){
    fs.mkdirSync(bannersDir, { recursive: true });
    console.log('✅ Carpeta de banners creada con éxito');
}

// Configuración de almacenamiento para banners
const bannersStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/banners/');
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

// Filtro para imágenes
const imageFilter = (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Formato de archivo no permitido (solo JPG, PNG, WEBP)'), false);
    }
};

// Middleware para subir banners (desktop y mobile)
export const uploadBanners = multer({
    storage: bannersStorage,
    fileFilter: imageFilter,
    limits: { fileSize: 1024 * 1024 * 5 } // 5MB límite
}).fields([
    { name: 'desktop', maxCount: 1 },
    { name: 'mobile', maxCount: 1 }
]);
