import expres, { Router } from "express";
import CustomerController from "../../../controllers/admin/customer";
import { authAdmin, validateRequest } from "../../../utils/middleware";
import Fileupload from "../../../utils/middleware/multer";

const routes: Router = expres.Router();
const customerController = new CustomerController();

routes.get("/list", validateRequest, customerController.getList.bind(customerController));
routes.post("/add", validateRequest, customerController.add.bind(customerController));
routes.put("/update/:id", validateRequest, customerController.update.bind(customerController));
routes.get("/by-id/:id", validateRequest, customerController.getDetailsById.bind(customerController));
routes.delete("/delete/:id", validateRequest, customerController.delete.bind(customerController));
routes.patch("/status/:id", validateRequest, customerController.status.bind(customerController));
routes.put("/updateProfileImg/:id", Fileupload.fields([{ name: 'product_image', maxCount: 1 }]), validateRequest, customerController.updateProfileImg.bind(customerController));

export default routes;