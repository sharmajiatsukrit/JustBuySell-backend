import expres, { Router } from "express";
import LocationController from "../../../controllers/user/location";
import { UserRouteEndPoints, AdminRouteEndPoints } from "../../../enums/user";
import { authRequest, validateRequest } from "../../../utils/middleware";
import { upload } from "../../../utils/storage";

const routes: Router = expres.Router();
const locationController = new LocationController();

routes.post("/update-location", authRequest, locationController.updateLocation.bind(locationController));


export default routes;