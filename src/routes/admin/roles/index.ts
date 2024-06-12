import expres, { Router } from "express";
import RoleController from "../../../controllers/admin/roles";
import { authAdmin, validateRequest } from "../../../utils/middleware";

const routes: Router = expres.Router();
const roleController = new RoleController();

routes.get("/list", authAdmin, validateRequest, roleController.getList.bind(roleController));
routes.post("/add", authAdmin, validateRequest, roleController.add.bind(roleController));
routes.put("/update/:id", authAdmin, validateRequest, roleController.update.bind(roleController));
routes.get("/by-id/:id", authAdmin, validateRequest, roleController.getDetailsById.bind(roleController));
routes.delete("/delete/:id", authAdmin, validateRequest, roleController.delete.bind(roleController));
routes.patch("/status/:id", authAdmin, validateRequest, roleController.status.bind(roleController));

export default routes;
