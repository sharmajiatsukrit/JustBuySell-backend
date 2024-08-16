import expres, { Router } from "express";
import Offers from "../../../controllers/admin/offers";
import { authAdmin, validateRequest } from "../../../utils/middleware";
import Fileupload from "../../../utils/middleware/multer";

const routes: Router = expres.Router();
const offersController = new Offers();

routes.post("/add", validateRequest, authAdmin, offersController.add.bind(offersController));
routes.put("/update/:id", validateRequest, authAdmin, offersController.update.bind(offersController));
routes.delete("/delete/:id", validateRequest, authAdmin, offersController.delete.bind(offersController));
routes.get("/list", validateRequest, authAdmin, offersController.getList.bind(offersController));
routes.get("/by-id/:id", validateRequest, authAdmin, offersController.getById.bind(offersController));

export default routes;
