import expres, { Router } from "express";
import NotificationController from "../../controllers/notification";
import { authRequest } from "../../utils/middleware";

const routes: Router = expres.Router();
const notificationController = new NotificationController();

routes.get("/", authRequest, notificationController.fetchAllNotification.bind(notificationController));

routes.post("/clear", authRequest, notificationController.clearNotification.bind(notificationController));

routes.post("/clear/:id", authRequest, notificationController.clearSingleNotification.bind(notificationController));

routes.get("/starred", authRequest, notificationController.fetchStarredNotification.bind(notificationController));

routes.post("/starred/:notification_id", authRequest, notificationController.setStarredMessage.bind(notificationController));

export default routes;
