import expres, { Router } from "express";
import RoleController from "../../../controllers/admin/roles";
import { authAdmin, validateRequest } from "../../../utils/middleware";

const routes: Router = expres.Router();
const roleController = new RoleController();

routes.get("/list", validateRequest, roleController.getList.bind(roleController));
routes.post("/add", validateRequest, roleController.add.bind(roleController));
routes.put("/update/:id", validateRequest, roleController.update.bind(roleController));
routes.get("/by-id/:id", validateRequest, roleController.getDetailsById.bind(roleController));
routes.delete("/delete/:id", validateRequest, roleController.delete.bind(roleController));
routes.patch("/status/:id", validateRequest, roleController.status.bind(roleController));

export default routes;
