import expres, { Router } from "express";
import HelperController from "../../../controllers/admin/helper";
import { authAdmin, validateRequest } from "../../../utils/middleware";
import CronController from "../../../controllers/cron";

const routes: Router = expres.Router();
const helperController = new HelperController();
const testController = new CronController();


routes.get("/get-cat-categories", validateRequest, authAdmin, helperController.getCatCategories.bind(helperController));
routes.get("/get-categories", validateRequest, authAdmin, helperController.getCategories.bind(helperController));
routes.get("/get-units", validateRequest, authAdmin, helperController.getUnits.bind(helperController));
routes.get("/get-attributes", validateRequest, authAdmin, helperController.getAttributes.bind(helperController));
routes.get("/get-attribute-items/:attribute_id", validateRequest, authAdmin, helperController.getAttributeItems.bind(helperController));
// routes.get("/get-attribute-items-by-key/:attribute_key", validateRequest, authAdmin, helperController.getAttributeItemsByKey.bind(helperController));
routes.get("/get-countries", validateRequest, authAdmin, helperController.getCounties.bind(helperController));
routes.get("/get-states", validateRequest, authAdmin, helperController.getStates.bind(helperController));
routes.get("/get-cities", validateRequest, authAdmin, helperController.getCities.bind(helperController));

routes.get("/get-roles", validateRequest, authAdmin, helperController.getRoles.bind(helperController));
routes.get("/get-customers", validateRequest, authAdmin, helperController.getCustomers.bind(helperController));


routes.get("/dashboard/get-totals", validateRequest, authAdmin, helperController.getDashboardTotals.bind(helperController));
routes.get("/test-pdf", testController.generateInvoice.bind(testController));

export default routes;
