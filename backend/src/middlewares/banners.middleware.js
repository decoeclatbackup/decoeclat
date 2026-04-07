import multer from 'multer';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import { cloudinary } from '../config/cloudinary.js';

const bannersStorage = new CloudinaryStorage({
    cloudinary,
    params: async (_req, file) => ({
        folder: 'decoeclat/banners',
        resource_type: 'image',
        allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
        public_id: `${file.fieldname}-${Date.now()}-${Math.round(Math.random() * 1e9)}`,
    }),
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

// Middleware base de multer para banners (desktop y mobile)
const uploadBannersMulter = multer({
    storage: bannersStorage,
    fileFilter: imageFilter,
    limits: { fileSize: 1024 * 1024 * 5 } // 5MB límite
}).fields([
    { name: 'desktop', maxCount: 1 },
    { name: 'mobile', maxCount: 1 }
]);

// Middleware con manejo explícito de errores de subida para evitar 500 genéricos
export const uploadBanners = (req, res, next) => {
    uploadBannersMulter(req, res, (err) => {
        if (!err) {
            return next();
        }

        return res.status(400).json({
            error: err.message || "Error al subir banners",
        });
    });
};
