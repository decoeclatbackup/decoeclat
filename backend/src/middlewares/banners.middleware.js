import multer from 'multer';
import sharp from 'sharp';
import { uploadBufferToCloudinary } from '../config/cloudinary.js';

const BANNERS_FOLDER = 'decoeclat/banners';
const TARGET_SIZE_BYTES = 1500 * 1024;
const MAX_UPLOAD_SIZE_BYTES = 20 * 1024 * 1024;
const MIN_QUALITY = 60;

// Filtro para imágenes
const imageFilter = (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/pjpeg', 'image/png', 'image/x-png', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Formato de archivo no permitido (solo JPG, PNG, WEBP)'), false);
    }
};

// Middleware base de multer para banners (desktop y mobile)
const uploadBannersMulter = multer({
    storage: multer.memoryStorage(),
    fileFilter: imageFilter,
    limits: { fileSize: MAX_UPLOAD_SIZE_BYTES }
}).fields([
    { name: 'desktop', maxCount: 1 },
    { name: 'mobile', maxCount: 1 }
]);

function getOutputFormat(mimetype) {
    if (mimetype === 'image/jpeg' || mimetype === 'image/jpg' || mimetype === 'image/pjpeg') return 'jpeg';
    if (mimetype === 'image/png' || mimetype === 'image/x-png') return 'png';
    return 'webp';
}

async function encodeImage(buffer, format, quality) {
    let pipeline = sharp(buffer, { failOn: 'none' }).rotate();

    if (format === 'jpeg') {
        return pipeline
            .jpeg({
                quality,
                mozjpeg: false,
                chromaSubsampling: '4:2:0',
            })
            .toBuffer();
    }

    if (format === 'png') {
        return pipeline
            .png({
                compressionLevel: 6,
                progressive: false,
                palette: true,
                quality: Math.max(40, quality),
            })
            .toBuffer();
    }

    return pipeline.webp({ quality, effort: 2 }).toBuffer();
}

function buildQualitySteps(originalSize) {
    if (originalSize <= TARGET_SIZE_BYTES) return [];

    const ratio = TARGET_SIZE_BYTES / originalSize;
    let baseQuality = 90;

    if (ratio < 0.35) baseQuality = 72;
    else if (ratio < 0.5) baseQuality = 78;
    else if (ratio < 0.7) baseQuality = 84;
    else if (ratio < 0.9) baseQuality = 88;

    const qualitySteps = [
        baseQuality,
        Math.max(MIN_QUALITY, baseQuality - 10),
        Math.max(MIN_QUALITY, baseQuality - 20),
    ];

    return [...new Set(qualitySteps)];
}

async function compressImageToTarget(buffer, mimetype) {
    const format = getOutputFormat(mimetype);
    let lastBuffer = buffer;
    const qualitySteps = buildQualitySteps(buffer.length);

    if (qualitySteps.length === 0) {
        return { buffer, format };
    }

    for (const quality of qualitySteps) {
        const encoded = await encodeImage(buffer, format, quality);
        lastBuffer = encoded;

        if (encoded.length <= TARGET_SIZE_BYTES) {
            return { buffer: encoded, format };
        }
    }

    return { buffer: lastBuffer, format };
}

// Middleware con manejo explícito de errores de subida para evitar 500 genéricos
export const uploadBanners = (req, res, next) => {
    uploadBannersMulter(req, res, async (err) => {
        if (err) {
            if (err instanceof multer.MulterError && err.code === 'LIMIT_FILE_SIZE') {
                return res.status(413).json({ error: 'La imagen supera el tamaño máximo de 20MB' });
            }

            return res.status(400).json({
                error: err.message || 'Error al subir banners',
            });
        }

        try {
            const fields = ['desktop', 'mobile'];

            for (const fieldName of fields) {
                const files = req.files?.[fieldName];
                if (!Array.isArray(files) || files.length === 0) continue;

                const originalFile = files[0];
                const compressed = await compressImageToTarget(originalFile.buffer, originalFile.mimetype);
                const publicId = `${fieldName}-${Date.now()}-${Math.round(Math.random() * 1e9)}`;

                const uploaded = await uploadBufferToCloudinary(compressed.buffer, {
                    folder: BANNERS_FOLDER,
                    resource_type: 'image',
                    public_id: publicId,
                    format: compressed.format,
                });

                req.files[fieldName] = [uploaded];
            }

            return next();
        } catch (uploadError) {
            return res.status(500).json({
                error: uploadError.message || 'No se pudo comprimir o subir banners',
            });
        }
    });
};