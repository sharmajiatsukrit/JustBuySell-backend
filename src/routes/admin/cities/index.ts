import expres, { Router } from "express";
import CityController from "../../../controllers/admin/city";
import { authAdmin, validateRequest } from "../../../utils/middleware";

const routes: Router = expres.Router();
const cityController = new CityController();

routes.get("/list", validateRequest, authAdmin, cityController.getList.bind(cityController));
routes.post("/add", validateRequest, authAdmin, cityController.add.bind(cityController));
routes.put("/update/:id", validateRequest, authAdmin, cityController.update.bind(cityController));
routes.get("/by-id/:id", validateRequest, authAdmin, cityController.getDetailsById.bind(cityController));
routes.delete("/delete/:id", validateRequest, authAdmin, cityController.delete.bind(cityController));
routes.patch("/status/:id", validateRequest, authAdmin, cityController.status.bind(cityController));

export default routes;
