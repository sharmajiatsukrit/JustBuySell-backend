import expres, { Router } from "express";
import ProductController from "../../../controllers/admin/products";
import { authAdmin, validateRequest } from "../../../utils/middleware";
import Fileupload from "../../../utils/middleware/multer";
import { upload } from "../../../utils/storage";
const routes: Router = expres.Router();
const productController = new ProductController();

routes.get("/list", validateRequest, authAdmin, productController.getList.bind(productController));
routes.post("/add", validateRequest, authAdmin, upload.single("product_image"), productController.add.bind(productController));
routes.put("/update/:id", validateRequest, authAdmin, upload.single("product_image"), productController.update.bind(productController));
routes.get("/by-id/:id", validateRequest, authAdmin, productController.getById.bind(productController));
routes.delete("/delete/:id", validateRequest, authAdmin, productController.delete.bind(productController));
routes.patch("/status/:id", validateRequest, authAdmin, productController.status.bind(productController));

export default routes;
