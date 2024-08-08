import expres, { Router } from "express";
import CategoryController from "../../../controllers/admin/category";
import { authAdmin, validateRequest } from "../../../utils/middleware";
import Fileupload from "../../../utils/middleware/multer";
import { upload } from "../../../utils/storage";
const routes: Router = expres.Router();
const categoryController = new CategoryController();

routes.get("/list", validateRequest, authAdmin, categoryController.getList.bind(categoryController));
routes.post("/add", upload.single("cat_image"), authAdmin, validateRequest, categoryController.add.bind(categoryController));
routes.put("/update/:id", upload.single("cat_image"), validateRequest, authAdmin, categoryController.update.bind(categoryController));
routes.get("/by-id/:id", validateRequest, authAdmin, categoryController.getDetailsById.bind(categoryController));
routes.delete("/delete/:id", validateRequest, authAdmin, categoryController.delete.bind(categoryController));
routes.patch("/status/:id", validateRequest, authAdmin, categoryController.status.bind(categoryController));

export default routes;
