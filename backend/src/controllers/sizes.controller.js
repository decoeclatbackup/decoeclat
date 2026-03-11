import { sizesService } from "../services/sizes.service.js";

export const sizesController = {
  async list(req, res) {
    try {
      const sizes = await sizesService.getSizes();
      res.json(sizes);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },
};
