import expres, { Router } from "express";
import HelperController from "../../../controllers/admin/helper";
import { authAdmin, validateRequest } from "../../../utils/middleware";

const routes: Router = expres.Router();
const helperController = new HelperController();

routes.get("/get-categories", validateRequest, helperController.getCategories.bind(helperController));
routes.get("/get-units", validateRequest, helperController.getUnits.bind(helperController));
routes.get("/get-countries", validateRequest, helperController.getCounties.bind(helperController));
routes.get("/get-states", validateRequest, helperController.getStates.bind(helperController));
routes.get("/get-cities", validateRequest, helperController.getCities.bind(helperController));

routes.get("/get-roles", validateRequest, helperController.getRoles.bind(helperController));
export default routes;
