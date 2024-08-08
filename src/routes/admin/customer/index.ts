import expres, { Router } from "express";
import CustomerController from "../../../controllers/admin/customer";
import { authAdmin, authRequest, validateRequest } from "../../../utils/middleware";
import Fileupload from "../../../utils/middleware/multer";
import { upload } from "../../../utils/storage";
const routes: Router = expres.Router();
const customerController = new CustomerController();

routes.get("/list", validateRequest, authAdmin, customerController.getList.bind(customerController));
routes.post("/add", validateRequest, authAdmin, customerController.add.bind(customerController));
routes.put("/update/:id", validateRequest, authAdmin, customerController.update.bind(customerController));
routes.put("/profile-update", validateRequest, authRequest, customerController.profileUpdate.bind(customerController));
routes.get("/by-id/:id", validateRequest, authAdmin, customerController.getDetailsById.bind(customerController));
routes.delete("/delete/:id", validateRequest, authAdmin, customerController.delete.bind(customerController));
routes.patch("/status/:id", validateRequest, authAdmin, customerController.status.bind(customerController));
// routes.put("/updateProfileImg/:id", Fileupload.fields([{ name: 'product_image', maxCount: 1 }]), authAdmin, validateRequest, customerController.updateProfileImg.bind(customerController));

export default routes;