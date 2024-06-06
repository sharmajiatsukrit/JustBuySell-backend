import expres, { Router } from "express";
import ProductController from "../../../controllers/admin/products";
import { authAdmin, validateRequest } from "../../../utils/middleware";
import Fileupload from "../../../utils/middleware/multer";

const routes: Router = expres.Router();
const productController = new ProductController();

routes.get("/list", validateRequest, productController.getList.bind(productController));
routes.post("/add", Fileupload.fields([{ name: 'product_image', maxCount: 1 }]), validateRequest, productController.add.bind(productController));
routes.put("/update/:id", Fileupload.fields([{ name: 'product_image', maxCount: 1 }]), validateRequest, productController.update.bind(productController));
routes.get("/by-id/:id", validateRequest, productController.getDetailsById.bind(productController));
routes.delete("/delete/:id", validateRequest, productController.delete.bind(productController));
routes.patch("/status/:id", validateRequest, productController.status.bind(productController));

export default routes;
