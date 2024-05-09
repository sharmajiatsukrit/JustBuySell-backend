import expres, { Router } from "express";
import PermissionController from "../../../controllers/admin/permissions";
import { authAdmin, validateRequest } from "../../../utils/middleware";

const routes: Router = expres.Router();
const permissionController = new PermissionController();

routes.get("/list", validateRequest, permissionController.getList.bind(permissionController));
routes.post("/add", validateRequest, permissionController.add.bind(permissionController));
routes.put("/update/:id", validateRequest, permissionController.update.bind(permissionController));
routes.get("/by-id/:id", validateRequest, permissionController.getDetailsById.bind(permissionController));
routes.delete("/delete/:id", validateRequest, permissionController.delete.bind(permissionController));
routes.patch("/status/:id", validateRequest, permissionController.status.bind(permissionController));

export default routes;
