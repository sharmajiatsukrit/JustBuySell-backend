import expres, { Router } from "express";
import CountryController from "../../../controllers/admin/country";
import { authAdmin, validateRequest } from "../../../utils/middleware";

const routes: Router = expres.Router();
const countryController = new CountryController();

routes.get("/list", validateRequest, authAdmin, countryController.getList.bind(countryController));
routes.post("/add", validateRequest, authAdmin, countryController.add.bind(countryController));
routes.put("/update/:id", validateRequest, authAdmin, countryController.update.bind(countryController));
routes.get("/by-id/:id", validateRequest, authAdmin, countryController.getDetailsById.bind(countryController));
routes.delete("/delete/:id", validateRequest, authAdmin, countryController.delete.bind(countryController));
routes.patch("/status/:id", validateRequest, authAdmin, countryController.status.bind(countryController));

export default routes;
