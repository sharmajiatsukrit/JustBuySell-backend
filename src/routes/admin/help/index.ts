import expres, { Router } from "express";
import HelpController from "../../../controllers/admin/help";
import { authAdmin, authRequest, validateRequest } from "../../../utils/middleware";
import Fileupload from "../../../utils/middleware/multer";

const routes: Router = expres.Router();
const helpController = new HelpController();

routes.post("/addhelp", validateRequest, authAdmin, helpController.addhelp.bind(helpController));
routes.get("/displayhelp", validateRequest, authRequest, helpController.displayhelp.bind(helpController));

export default routes;