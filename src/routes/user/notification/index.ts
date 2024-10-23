import expres, { Router } from "express";
import NotificationController from "../../../controllers/user/notification";
import { authRequest, validateRequest } from "../../../utils/middleware";

const routes: Router = expres.Router();
const notificationController = new NotificationController();

routes.get("/", validateRequest, authRequest, notificationController.fetchAllNotification.bind(notificationController));

routes.post("/clear", validateRequest, authRequest, notificationController.clearNotification.bind(notificationController));

routes.delete("/clear/:id", validateRequest, authRequest, notificationController.clearSingleNotification.bind(notificationController));


export default routes;
