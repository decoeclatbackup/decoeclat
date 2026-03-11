import { sizesRepository } from "../repositories/sizes.repository.js";

export const sizesService = {
  async getSizes() {
    return sizesRepository.findAll();
  },
};
