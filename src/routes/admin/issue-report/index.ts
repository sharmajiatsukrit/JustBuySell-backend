import expres, { Router } from "express";
import BugReportController from "../../../controllers/admin/issue-report";
import { authAdmin, validateRequest } from "../../../utils/middleware";

const routes: Router = expres.Router();
const bugreportController = new BugReportController();

routes.get("/list", validateRequest, authAdmin, bugreportController.getList.bind(bugreportController));
routes.post("/add", validateRequest, authAdmin, bugreportController.add.bind(bugreportController));
routes.put("/update/:id", validateRequest, authAdmin, bugreportController.update.bind(bugreportController));
routes.get("/by-id/:id", validateRequest, authAdmin, bugreportController.getById.bind(bugreportController));
routes.delete("/delete/:id", validateRequest, authAdmin, bugreportController.delete.bind(bugreportController));
routes.patch("/status/:id", validateRequest, authAdmin, bugreportController.status.bind(bugreportController));

export default routes;
