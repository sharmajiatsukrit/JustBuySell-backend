import expres, { Router } from "express";
import PermissionController from "../../../controllers/admin/permissions";
import { authAdmin, validateRequest } from "../../../utils/middleware";

const routes: Router = expres.Router();
const permissionController = new PermissionController();

routes.get("/list", validateRequest, authAdmin, permissionController.getList.bind(permissionController));
routes.post("/add", validateRequest, authAdmin, permissionController.add.bind(permissionController));
routes.put("/update/:id", validateRequest, authAdmin, permissionController.update.bind(permissionController));
routes.get("/by-id/:id", validateRequest, authAdmin, permissionController.getDetailsById.bind(permissionController));
routes.delete("/delete/:id", validateRequest, authAdmin, permissionController.delete.bind(permissionController));
routes.patch("/status/:id", validateRequest, authAdmin, permissionController.status.bind(permissionController));

export default routes;
