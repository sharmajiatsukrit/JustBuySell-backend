import expres, { Router } from "express";
import Offers from "../../../controllers/user/postnewoffer";
import { authRequest, validateRequest } from "../../../utils/middleware";
import Fileupload from "../../../utils/middleware/multer";

const routes: Router = expres.Router();
const offersController = new Offers();

routes.post("/add", validateRequest, authRequest, offersController.add.bind(offersController));
routes.put("/update/:id", validateRequest, authRequest, offersController.update.bind(offersController));
routes.delete("/delete/:id", validateRequest, authRequest, offersController.delete.bind(offersController));
routes.get("/get-list", validateRequest, authRequest, offersController.getList.bind(offersController));
routes.get("/get-details-byid/:id", validateRequest, authRequest, offersController.getDetailsById.bind(offersController));
routes.patch("/offerstatus/:id", validateRequest, authRequest, offersController.offerStatus.bind(offersController));

export default routes;
