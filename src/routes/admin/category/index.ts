import expres, { Router } from "express";
import CategoryController from "../../../controllers/admin/category";
import { authAdmin, validateRequest } from "../../../utils/middleware";
import Fileupload from "../../../utils/middleware/multer";

const routes: Router = expres.Router();
const categoryController = new CategoryController();

routes.get("/list", validateRequest, categoryController.getList.bind(categoryController));
routes.post("/add", Fileupload.fields([{ name: 'cat_img', maxCount: 1 }]), validateRequest, categoryController.add.bind(categoryController));
routes.put("/update/:id", validateRequest, categoryController.update.bind(categoryController));
routes.get("/by-id/:id", validateRequest, categoryController.getDetailsById.bind(categoryController));
routes.delete("/delete/:id", validateRequest, categoryController.delete.bind(categoryController));
routes.patch("/status/:id", validateRequest, categoryController.status.bind(categoryController));

export default routes;
