import expres, { Router } from "express";
import UserController from "../../../controllers/admin/users";
import { authAdmin, validateRequest } from "../../../utils/middleware";
// import Fileupload from "../../../utils/middleware/multer";
import { upload } from "../../../utils/storage";
const routes: Router = expres.Router();
const userController = new UserController();

routes.get("/list", validateRequest, authAdmin, userController.getList.bind(userController));
routes.post("/add", validateRequest, authAdmin, upload.single("profile_img"), userController.add.bind(userController));
routes.put("/update/:id", validateRequest, authAdmin, upload.single("profile_img"), userController.update.bind(userController));
routes.get("/by-id/:id", validateRequest, authAdmin, userController.getDetailsById.bind(userController));
routes.delete("/delete/:id", validateRequest, authAdmin, userController.delete.bind(userController));
routes.patch("/status/:id", validateRequest, authAdmin, userController.status.bind(userController));
// routes.patch("/changepass/:id", validateRequest, authAdmin, userController.changePass.bind(userController));
// routes.put("/updateProfileImg/:id", Fileupload.fields([{ name: 'product_image', maxCount: 1 }]), authAdmin, validateRequest, userController.updateProfileImg.bind(userController));

export default routes;
