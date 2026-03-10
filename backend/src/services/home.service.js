import { homeRepository } from "../repositories/home.repository.js";

export const homeService = {
    async getHomeData() {
        try {
            const [productosHome, carouselHome] = await Promise.all([
                homeRepository.getProductosHome(),
                homeRepository.getCarouselHome()
            ]);

            return {
                productosDestacados: productosHome,
                banners: carouselHome
            };
        } catch (error) {
            throw new Error("Error al obtener datos del home");
        }
    },

    async addProductoHome(producto_id, orden = 0) {
        // Validar que el producto existe
        const productoExists = await homeRepository.checkProductoExists(producto_id);
        if (!productoExists) {
            throw new Error("Producto no encontrado");
        }

        return await homeRepository.addProductoHome(producto_id, orden);
    },

    async updateProductoHome(home_id, updates) {
        if (updates.producto_id) {
            const productoExists = await homeRepository.checkProductoExists(updates.producto_id);
            if (!productoExists) {
                throw new Error("Producto no encontrado");
            }
        }

        const result = await homeRepository.updateProductoHome(home_id, updates);
        if (!result) {
            throw new Error("Producto home no encontrado o no hay campos para actualizar");
        }
        return result;
    },

    async removeProductoHome(home_id) {
        const result = await homeRepository.removeProductoHome(home_id);
        if (!result) {
            throw new Error("Producto home no encontrado");
        }
        return result;
    },

    async addCarouselItem(img_desktop_url, img_mobile_url, orden = 0, producto_id = null, categoria_id = null) {
        // Validar que al menos una imagen esté presente
        if (!img_desktop_url && !img_mobile_url) {
            throw new Error("Se requiere al menos una imagen (desktop o mobile)");
        }

        // Validar producto_id si se proporciona
        if (producto_id) {
            const productoExists = await homeRepository.checkProductoExists(producto_id);
            if (!productoExists) {
                throw new Error("Producto no encontrado");
            }
        }

        // Validar categoria_id si se proporciona
        if (categoria_id) {
            const categoriaExists = await homeRepository.checkCategoriaExists(categoria_id);
            if (!categoriaExists) {
                throw new Error("Categoría no encontrada");
            }
        }

        return await homeRepository.addCarouselItem(img_desktop_url, img_mobile_url, orden, producto_id, categoria_id);
    },

    async updateCarouselItem(carousel_id, updates) {
        // Validar producto_id si se proporciona
        if (updates.producto_id) {
            const productoExists = await homeRepository.checkProductoExists(updates.producto_id);
            if (!productoExists) {
                throw new Error("Producto no encontrado");
            }
        }

        // Validar categoria_id si se proporciona
        if (updates.categoria_id) {
            const categoriaExists = await homeRepository.checkCategoriaExists(updates.categoria_id);
            if (!categoriaExists) {
                throw new Error("Categoría no encontrada");
            }
        }

        const result = await homeRepository.updateCarouselItem(carousel_id, updates);
        if (!result) {
            throw new Error("Item del carrusel no encontrado o no hay campos para actualizar");
        }
        return result;
    },

    async removeCarouselItem(carousel_id) {
        const result = await homeRepository.removeCarouselItem(carousel_id);
        if (!result) {
            throw new Error("Item del carrusel no encontrado");
        }
        return result;
    }
};
