import {Router} from 'express';
import {variantesController} from "../controllers/variantes.controller.js";
import { verificarToken, esAdmin } from "../middlewares/auth.middlewares.js";


const router = Router();

router.post("/variantes", verificarToken, esAdmin, variantesController.create);
router.get("/variantes", variantesController.getByProduct);
router.get("/variantes/:id", variantesController.getByProductById);
router.put("/variantes/:id", verificarToken, esAdmin, variantesController.update);
router.delete("/variantes/:id", verificarToken, esAdmin, variantesController.remove);

export default router;