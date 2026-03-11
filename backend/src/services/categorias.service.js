import { categoriasRepository } from "../repositories/categorias.repository.js";

export const categoriasService = {
  async getCategorias() {
    return categoriasRepository.findAll();
  },
};
