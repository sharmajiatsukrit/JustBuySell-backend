import expres, { Router } from "express";
import UserController from "../../../controllers/admin/users";
import { authAdmin, validateRequest } from "../../../utils/middleware";

const routes: Router = expres.Router();
const userController = new UserController();

routes.get("/", authAdmin, userController.getList.bind(userController));
routes.post("/add", validateRequest, userController.add.bind(userController));
routes.put("/update/:id", authAdmin, userController.update.bind(userController));
routes.get("/get-details/:id", authAdmin, userController.getDetailsById.bind(userController));
routes.delete("/delete/:id", authAdmin, userController.delete.bind(userController));
routes.patch("/status/:id", authAdmin, userController.status.bind(userController));

export default routes;
