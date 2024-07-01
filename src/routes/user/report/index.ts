import expres, { Router } from "express";
import ReportController from "../../../controllers/user/report";
import { UserRouteEndPoints,AdminRouteEndPoints } from "../../../enums/user";
import { authRequest, validateRequest } from "../../../utils/middleware";
import { upload } from "../../../utils/storage";

const routes: Router = expres.Router();
const reportController = new ReportController();

routes.post("/addreport", reportController.validate(UserRouteEndPoints.Getsearch), authRequest, validateRequest, reportController.addReport.bind(reportController));

export default routes;