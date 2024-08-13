import expres, { Router } from "express";
import CategoryController from "../../../controllers/admin/category";
import { authAdmin, validateRequest } from "../../../utils/middleware";
import Fileupload from "../../../utils/middleware/multer";
import { upload } from "../../../utils/storage";
const routes: Router = expres.Router();
const categoryController = new CategoryController();

routes.get("/list", validateRequest, authAdmin, categoryController.getList.bind(categoryController));
routes.post("/add", validateRequest, authAdmin, upload.single("cat_img"), categoryController.add.bind(categoryController));
routes.put("/update/:id", validateRequest, authAdmin, upload.single("cat_img"), categoryController.update.bind(categoryController));
routes.get("/by-id/:id", validateRequest, authAdmin, categoryController.getById.bind(categoryController));
routes.delete("/delete/:id", validateRequest, authAdmin, categoryController.delete.bind(categoryController));
routes.patch("/status/:id", validateRequest, authAdmin, categoryController.status.bind(categoryController));

export default routes;
