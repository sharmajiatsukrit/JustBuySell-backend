import expres, { Router } from "express";
import StateController from "../../../controllers/admin/state";
import { authAdmin, validateRequest } from "../../../utils/middleware";

const routes: Router = expres.Router();
const stateController = new StateController();

routes.get("/list", authAdmin, validateRequest, stateController.getList.bind(stateController));
routes.post("/add", authAdmin, validateRequest, stateController.add.bind(stateController));
routes.put("/update/:id", authAdmin, validateRequest, stateController.update.bind(stateController));
routes.get("/by-id/:id", authAdmin, validateRequest, stateController.getDetailsById.bind(stateController));
routes.delete("/delete/:id", authAdmin, validateRequest, stateController.delete.bind(stateController));
routes.patch("/status/:id", authAdmin, validateRequest, stateController.status.bind(stateController));

export default routes;
