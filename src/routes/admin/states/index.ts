import expres, { Router } from "express";
import StateController from "../../../controllers/admin/state";
import { authAdmin, validateRequest } from "../../../utils/middleware";

const routes: Router = expres.Router();
const stateController = new StateController();

routes.get("/list", validateRequest, stateController.getList.bind(stateController));
routes.post("/add", validateRequest, stateController.add.bind(stateController));
routes.put("/update/:id", validateRequest, stateController.update.bind(stateController));
routes.get("/by-id/:id", validateRequest, stateController.getDetailsById.bind(stateController));
routes.delete("/delete/:id", validateRequest, stateController.delete.bind(stateController));
routes.patch("/status/:id", validateRequest, stateController.status.bind(stateController));

export default routes;
