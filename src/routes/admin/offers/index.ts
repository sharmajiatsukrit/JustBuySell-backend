import expres, { Router } from "express";
import Offers from "../../../controllers/admin/offers";
import { authAdmin, validateRequest } from "../../../utils/middleware";
import Fileupload from "../../../utils/middleware/multer";

const routes: Router = expres.Router();
const offersController = new Offers();

routes.post("/add", validateRequest, authAdmin, offersController.add.bind(offersController));
routes.put("/update/:id", validateRequest, authAdmin, offersController.update.bind(offersController));
routes.delete("/delete/:id", validateRequest, authAdmin, offersController.delete.bind(offersController));
routes.get("/get-list", validateRequest, authAdmin, offersController.getList.bind(offersController));
routes.get("/get-details-byid/:id", validateRequest, authAdmin, offersController.getDetailsById.bind(offersController));

export default routes;
