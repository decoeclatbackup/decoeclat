import { homeService } from "../services/home.service.js";

function resolveUploadedImage(file) {
    return file?.path || file?.secure_url || null;
}

export const homeController = {
    async getHomeData(req, res) {
        try {
            const data = await homeService.getHomeData();
            return res.status(200).json(data);
        } catch (error) {
            return res.status(500).json({ error: error.message });
        }
    },

    // === PRODUCTOS HOME ===

    async addProductoHome(req, res) {
        try {
            const { producto_id, orden } = req.body;
            const nuevoProducto = await homeService.addProductoHome(producto_id, orden);
            return res.status(201).json(nuevoProducto);
        } catch (error) {
            return res.status(400).json({ error: error.message });
        }
    },

    async updateProductoHome(req, res) {
        try {
            const { home_id } = req.params;
            const updates = req.body;
            const updated = await homeService.updateProductoHome(home_id, updates);
            return res.status(200).json(updated);
        } catch (error) {
            return res.status(400).json({ error: error.message });
        }
    },

    async removeProductoHome(req, res) {
        try {
            const { home_id } = req.params;
            await homeService.removeProductoHome(home_id);
            return res.status(204).send();
        } catch (error) {
            return res.status(400).json({ error: error.message });
        }
    },

    // === CAROUSEL HOME ===

    async getCarouselHome(req, res) {
        try {
            const carousel = await homeService.getCarouselHome();
            return res.status(200).json(carousel);
        } catch (error) {
            console.error("Error en getCarouselHome:", error);
            return res.status(500).json({ error: error.message });
        }
    },

    async addCarouselItem(req, res) {
        try {
            const { orden, producto_id, categoria_id } = req.body;

            // Verificar que se subió al menos una imagen
            if (!req.files || (!req.files.desktop && !req.files.mobile)) {
                return res.status(400).json({ error: "Se requiere al menos una imagen (desktop o mobile)" });
            }

            const desktopPath = req.files.desktop ? resolveUploadedImage(req.files.desktop[0]) : null;
            const mobilePath = req.files.mobile ? resolveUploadedImage(req.files.mobile[0]) : null;

            const nuevoItem = await homeService.addCarouselItem(
                desktopPath,
                mobilePath,
                orden,
                producto_id || null,
                categoria_id || null
            );

            return res.status(201).json(nuevoItem);
        } catch (error) {
            return res.status(400).json({ error: error.message });
        }
    },

    async updateCarouselItem(req, res) {
        try {
            const { carousel_id } = req.params;
            const updates = req.body;

            // Si se suben nuevas imágenes, actualizar rutas
            if (req.files) {
                if (req.files.desktop) {
                    updates.img_desktop_url = resolveUploadedImage(req.files.desktop[0]);
                }
                if (req.files.mobile) {
                    updates.img_mobile_url = resolveUploadedImage(req.files.mobile[0]);
                }
            }

            const updated = await homeService.updateCarouselItem(carousel_id, updates);
            return res.status(200).json(updated);
        } catch (error) {
            return res.status(400).json({ error: error.message });
        }
    },

    async removeCarouselItem(req, res) {
        try {
            const { carousel_id } = req.params;
            await homeService.removeCarouselItem(carousel_id);
            return res.status(204).send();
        } catch (error) {
            return res.status(400).json({ error: error.message });
        }
    }
};
