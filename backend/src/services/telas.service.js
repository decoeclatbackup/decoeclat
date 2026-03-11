import { telasRepository } from "../repositories/telas.repository.js";

export const telasService = {
  async getTelas() {
    return telasRepository.findAll();
  },
};
