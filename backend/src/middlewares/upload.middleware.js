import multer from 'multer';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import { cloudinary, getCloudinaryFolder } from '../config/cloudinary.js';

const storage = new CloudinaryStorage({
    cloudinary,
    params: async (_req, file) => ({
        folder: getCloudinaryFolder(),
        resource_type: 'image',
        allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
        public_id: `producto-${Date.now()}-${Math.round(Math.random() * 1e9)}`,
    }),
});

// Filtro para que solo suban imágenes
const fileFilter = (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Formato de archivo no permitido (solo JPG, PNG, WEBP)'), false);
    }
};

export const upload = multer({ 
    storage,
    fileFilter,
    limits: { fileSize: 1024 * 1024 * 5 } // Límite de 5MB
});