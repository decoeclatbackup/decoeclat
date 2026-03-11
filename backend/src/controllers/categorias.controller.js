import { categoriasService } from "../services/categorias.service.js";

export const categoriasController = {
  async list(req, res) {
    try {
      const categorias = await categoriasService.getCategorias();
      return res.status(200).json(categorias);
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  },
};
