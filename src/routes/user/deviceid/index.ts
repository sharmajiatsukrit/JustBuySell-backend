import expres, { Router } from "express";
import DeviceidController from "../../../controllers/user/deviceid";
import { UserRouteEndPoints, AdminRouteEndPoints } from "../../../enums/user";
import { authRequest, validateRequest } from "../../../utils/middleware";
import { upload } from "../../../utils/storage";

const routes: Router = expres.Router();
const deviceidController = new DeviceidController();

routes.patch("/firebase-id-update", authRequest, deviceidController.update.bind(deviceidController));


export default routes;