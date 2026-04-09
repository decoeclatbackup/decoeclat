import { variantesService } from "../services/variantes.service.js";

export const variantesController = {

    async create(req, res) {
        try {
            const body = req.body;

            const data= {
                productoId: body.productoId || body.producto_id,
                telaId: body.telaId || body.tela_id,
                sizeId: body.sizeId || body.size_id,
                color: body.color,
                relleno: body.relleno,
                stock: body.stock,
                precio: body.precio,
                precioOferta: body.precioOferta || body.precio_oferta,
                enOferta: body.enOferta || body.en_oferta
            };

            const newVariant= await variantesService.registerVariant(data);
            res.status(201).json(newVariant);
        }catch (err) {
            res.status(400).json({ error: err.message });
        }
    },

    async getByProduct(req, res) {
    try {
        // En lugar de req.params, buscamos en req.query
        const filters = {
            productoId: req.query.productoId || req.query.producto_id,
            enOferta: req.query.enOferta || req.query.en_oferta
        };

        // Si mandás el productoId, filtramos. Si no, podrías traer todas o tirar error.
        const variants = await variantesService.getVariantsByProduct(filters.productoId);
        
        res.json(variants);
    } catch (err) {
        // Usamos 500 para errores de servidor, igual que en tu función list
        res.status(500).json({ error: err.message });
    }
},

    async getByProductById(req, res) {
        try {
            const {id} = req.params;
            const variants = await variantesService.getVariantsByProductById(id);
            res.json(variants);
        }catch (err) {
            res.status(400).json({ error: err.message });
        }
    },


    async update(req, res) {
        try {
            const { id } = req.params;
            const updates = await variantesService.updateVariant(id, req.body);
            res.json(updates);
        }catch (err) {
            res.status(400).json({ error: err.message });
        }
    },

    async remove(req, res) {
        try {
            const { id } = req.params;
            await variantesService.removeVariant(id);
            res.status(204).send();
        }catch (err) {
            res.status(400).json({ error: err.message });
        }
    },

}