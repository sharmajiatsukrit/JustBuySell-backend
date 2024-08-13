import expres, { Router } from "express";
import UnitController from "../../../controllers/admin/unit";
import { authAdmin, validateRequest } from "../../../utils/middleware";

const routes: Router = expres.Router();
const unitController = new UnitController();

routes.get("/list", validateRequest, authAdmin, unitController.getList.bind(unitController));
routes.post("/add", validateRequest, authAdmin, unitController.add.bind(unitController));
routes.put("/update/:id", validateRequest, authAdmin, unitController.update.bind(unitController));
routes.get("/by-id/:id", validateRequest, authAdmin, unitController.getById.bind(unitController));
routes.delete("/delete/:id", validateRequest, authAdmin, unitController.delete.bind(unitController));
routes.patch("/status/:id", validateRequest, authAdmin, unitController.status.bind(unitController));

export default routes;
