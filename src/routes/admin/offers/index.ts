import expres, { Router } from "express";
import Offers from "../../../controllers/admin/offers";
import { authAdmin, validateRequest } from "../../../utils/middleware";
import Fileupload from "../../../utils/middleware/multer";

const routes: Router = expres.Router();
const offersController = new Offers();

routes.post("/add", validateRequest, offersController.add.bind(offersController));
routes.put("/update/:id", validateRequest, offersController.update.bind(offersController));
routes.delete("/delete/:id", validateRequest, offersController.delete.bind(offersController));
routes.get("/getList", validateRequest, offersController.getList.bind(offersController));
routes.get("/getDetailsById/:id", validateRequest, offersController.getDetailsById.bind(offersController));

export default routes;
