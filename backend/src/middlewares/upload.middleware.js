import multer from 'multer';
import sharp from 'sharp';
import { getCloudinaryFolder, uploadBufferToCloudinary } from '../config/cloudinary.js';

const TARGET_SIZE_BYTES = 500 * 1024;
const MAX_UPLOAD_SIZE_BYTES = 15 * 1024 * 1024;
const MIN_QUALITY = 36;

// Filtro para que solo suban imágenes
const fileFilter = (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Formato de archivo no permitido (solo JPG, PNG, WEBP)'), false);
    }
};

const upload = multer({
    storage: multer.memoryStorage(),
    fileFilter,
    limits: { fileSize: MAX_UPLOAD_SIZE_BYTES },
});

function getOutputFormat(mimetype) {
    if (mimetype === 'image/jpeg') return 'jpeg';
    if (mimetype === 'image/png') return 'png';
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
    let baseQuality = 82;

    if (ratio < 0.35) baseQuality = 52;
    else if (ratio < 0.5) baseQuality = 60;
    else if (ratio < 0.7) baseQuality = 68;
    else if (ratio < 0.9) baseQuality = 76;

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

export const uploadProductImage = (req, res, next) => {
    upload.array('url', 20)(req, res, async (error) => {
        if (error) {
            if (error instanceof multer.MulterError) {
                if (error.code === 'LIMIT_FILE_SIZE') {
                    return res.status(413).json({ error: 'La imagen supera el tamaño máximo de 15MB' });
                }

                return res.status(400).json({ error: error.message || 'Error al subir la imagen' });
            }

            return res.status(400).json({ error: error.message || 'No se pudo procesar la imagen' });
        }

        if (!Array.isArray(req.files) || req.files.length === 0) {
            return res.status(400).json({ error: 'Debe subir al menos una imagen' });
        }

        try {
            const folder = getCloudinaryFolder();
            const uploadedImages = [];

            for (const file of req.files) {
                const compressed = await compressImageToTarget(file.buffer, file.mimetype);
                const publicId = `producto-${Date.now()}-${Math.round(Math.random() * 1e9)}`;

                const uploaded = await uploadBufferToCloudinary(compressed.buffer, {
                    folder,
                    resource_type: 'image',
                    public_id: publicId,
                    format: compressed.format,
                });

                uploadedImages.push(uploaded);
            }

            req.uploadedImages = uploadedImages;
            return next();
        } catch (uploadError) {
            return res.status(500).json({ error: uploadError.message || 'No se pudo comprimir o subir la imagen' });
        }
    });
};