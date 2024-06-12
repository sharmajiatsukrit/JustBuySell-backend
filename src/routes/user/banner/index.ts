import expres, { Router } from "express";
import BannerController from "../../../controllers/user/banner";
import { authAdmin, validateRequest } from "../../../utils/middleware";
import { UserRouteEndPoints, AdminRouteEndPoints } from "../../../enums/user";
import Fileupload from "../../../utils/middleware/multer";

const routes: Router = expres.Router();
const bannerController = new BannerController();

routes.get("/getlist", bannerController.validate(UserRouteEndPoints.Getlist), validateRequest, bannerController.getList.bind(bannerController));
routes.get("/getbyid/:id", bannerController.validate(UserRouteEndPoints.Getlimitlist), validateRequest, bannerController.getList.bind(bannerController));

export default routes;