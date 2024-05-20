import expres, { Router } from "express";
import CountryController from "../../../controllers/admin/country";
import { authAdmin, validateRequest } from "../../../utils/middleware";

const routes: Router = expres.Router();
const countryController = new CountryController();

routes.get("/list", validateRequest, countryController.getList.bind(countryController));
routes.post("/add", validateRequest, countryController.add.bind(countryController));
routes.put("/update/:id", validateRequest, countryController.update.bind(countryController));
routes.get("/by-id/:id", validateRequest, countryController.getDetailsById.bind(countryController));
routes.delete("/delete/:id", validateRequest, countryController.delete.bind(countryController));
routes.patch("/status/:id", validateRequest, countryController.status.bind(countryController));

export default routes;
