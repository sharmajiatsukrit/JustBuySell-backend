import expres, { Router } from "express";
import NotificationTemplateController from "../../../controllers/admin/notification-template";
import { authAdmin, validateRequest } from "../../../utils/middleware";

const routes: Router = expres.Router();
const notificationtemplateController = new NotificationTemplateController();

routes.get("/list", validateRequest, authAdmin, notificationtemplateController.getList.bind(notificationtemplateController));
routes.post("/add", validateRequest, authAdmin, notificationtemplateController.add.bind(notificationtemplateController));
routes.put("/update/:id", validateRequest, authAdmin, notificationtemplateController.update.bind(notificationtemplateController));
routes.get("/by-id/:id", validateRequest, authAdmin, notificationtemplateController.getById.bind(notificationtemplateController));
routes.delete("/delete/:id", validateRequest, authAdmin, notificationtemplateController.delete.bind(notificationtemplateController));
routes.patch("/status/:id", validateRequest, authAdmin, notificationtemplateController.status.bind(notificationtemplateController));

export default routes;
