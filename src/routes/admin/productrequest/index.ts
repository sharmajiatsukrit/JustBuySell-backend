import expres, { Router } from "express";
import ProductRequestController from "../../../controllers/admin/productrequest";
import { authAdmin, validateRequest } from "../../../utils/middleware";
import Fileupload from "../../../utils/middleware/multer";

const routes: Router = expres.Router();
const productrequestController = new ProductRequestController();

routes.post("/add", validateRequest, authAdmin, productrequestController.add.bind(productrequestController));
routes.put("/update/:id", validateRequest, authAdmin, productrequestController.update.bind(productrequestController));
routes.delete("/delete/:id", validateRequest, authAdmin, productrequestController.delete.bind(productrequestController));
routes.get("/get-list", validateRequest, authAdmin, productrequestController.getList.bind(productrequestController));
routes.get("/get-details-byid/:id", authAdmin, validateRequest, productrequestController.getDetailsById.bind(productrequestController));
routes.patch("/update-status/:id", authAdmin, validateRequest, productrequestController.statusUpdate.bind(productrequestController));

export default routes;
