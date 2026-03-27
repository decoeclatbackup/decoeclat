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
        const normalizedProductoId = Number(producto_id);
        const normalizedOrden = Number(orden || 0);

        if (!Number.isInteger(normalizedProductoId) || normalizedProductoId <= 0) {
            throw new Error("Debes seleccionar un producto válido");
        }

        // Validar que el producto existe
        const productoExists = await homeRepository.checkProductoExists(normalizedProductoId);
        if (!productoExists) {
            throw new Error("Producto no encontrado");
        }

        const existente = await homeRepository.findProductoHomeByProductoId(normalizedProductoId);
        if (existente?.activo) {
            throw new Error("Este producto ya está destacado");
        }

        if (existente && !existente.activo) {
            return await homeRepository.updateProductoHome(existente.home_id, {
                activo: true,
                orden: Number.isFinite(normalizedOrden) ? normalizedOrden : 0,
            });
        }

        return await homeRepository.addProductoHome(
            normalizedProductoId,
            Number.isFinite(normalizedOrden) ? normalizedOrden : 0
        );
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

    async getCarouselHome() {
        return await homeRepository.getCarouselHome();
    },

    async getProductosHome() {
        return await homeRepository.getProductosHome();
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
