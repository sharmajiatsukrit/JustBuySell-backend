import expres, { Router } from "express";
import CityController from "../../../controllers/admin/city";
import { authAdmin, validateRequest } from "../../../utils/middleware";

const routes: Router = expres.Router();
const cityController = new CityController();

routes.get("/list", validateRequest, cityController.getList.bind(cityController));
routes.post("/add", validateRequest, cityController.add.bind(cityController));
routes.put("/update/:id", validateRequest, cityController.update.bind(cityController));
routes.get("/by-id/:id", validateRequest, cityController.getDetailsById.bind(cityController));
routes.delete("/delete/:id", validateRequest, cityController.delete.bind(cityController));
routes.patch("/status/:id", validateRequest, cityController.status.bind(cityController));

export default routes;
