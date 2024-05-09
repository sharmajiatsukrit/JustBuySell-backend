import expres, { Router } from "express";
import CountryController from "../../../controllers/admin/country";
import { authAdmin, validateRequest } from "../../../utils/middleware";

const routes: Router = expres.Router();
const countryController = new CountryController();

routes.get("/", authAdmin, countryController.getList.bind(countryController));
routes.post("/add", validateRequest, countryController.add.bind(countryController));
routes.put("/update/:id", authAdmin, countryController.update.bind(countryController));
routes.get("/by-id/:id", authAdmin, countryController.getDetailsById.bind(countryController));
routes.delete("/delete/:id", authAdmin, countryController.delete.bind(countryController));
routes.patch("/status/:id", authAdmin, countryController.status.bind(countryController));

export default routes;
