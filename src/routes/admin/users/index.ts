import expres, { Router } from "express";
import UserController from "../../../controllers/admin/users";
import { authAdmin, validateRequest } from "../../../utils/middleware";

const routes: Router = expres.Router();
const userController = new UserController();

routes.get("/list", validateRequest, userController.getList.bind(userController));
routes.post("/add", validateRequest, userController.add.bind(userController));
routes.put("/update/:id", validateRequest, userController.update.bind(userController));
routes.get("/by-id/:id", validateRequest, userController.getDetailsById.bind(userController));
routes.delete("/delete/:id", validateRequest, userController.delete.bind(userController));
routes.patch("/status/:id", validateRequest, userController.status.bind(userController));

export default routes;
