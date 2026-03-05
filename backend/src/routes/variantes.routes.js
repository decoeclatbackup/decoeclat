import {Router} from 'express';
import {variantesController} from "../controllers/variantes.controller.js";


const router = Router();

router.post("/variantes", variantesController.create);
router.get("/variantes", variantesController.getByProduct);
router.get("/variantes/:id", variantesController.getByProductById);
router.put("/variantes/:id", variantesController.update);
router.delete("/variantes/:id", variantesController.remove);

export default router;