import expres, { Router } from "express";
import UnitController from "../../../controllers/admin/unit";
import { authAdmin, validateRequest } from "../../../utils/middleware";

const routes: Router = expres.Router();
const unitController = new UnitController();

routes.get("/list", validateRequest, unitController.getList.bind(unitController));
routes.post("/add", validateRequest, unitController.add.bind(unitController));
routes.put("/update/:id", validateRequest, unitController.update.bind(unitController));
routes.get("/by-id/:id", validateRequest, unitController.getDetailsById.bind(unitController));
routes.delete("/delete/:id", validateRequest, unitController.delete.bind(unitController));
routes.patch("/status/:id", validateRequest, unitController.status.bind(unitController));

export default routes;
