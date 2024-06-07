import expres, { Router } from "express";
import UserController from "../../../controllers/admin/users";
import { authAdmin, validateRequest } from "../../../utils/middleware";
import Fileupload from "../../../utils/middleware/multer";

const routes: Router = expres.Router();
const userController = new UserController();

routes.get("/list", validateRequest, userController.getList.bind(userController));
routes.post("/add", validateRequest, userController.add.bind(userController));
routes.put("/update/:id", validateRequest, userController.update.bind(userController));
routes.get("/by-id/:id", validateRequest, userController.getDetailsById.bind(userController));
routes.delete("/delete/:id", validateRequest, userController.delete.bind(userController));
routes.patch("/status/:id", validateRequest, userController.status.bind(userController));
routes.patch("/changepass/:id", validateRequest, userController.changePass.bind(userController));
routes.put("/updateProfileImg/:id", Fileupload.fields([{ name: 'product_image', maxCount: 1 }]), validateRequest, userController.updateProfileImg.bind(userController));

export default routes;
