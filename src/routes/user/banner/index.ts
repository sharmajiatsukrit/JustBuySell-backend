import expres, { Router } from "express";
import BannerController from "../../../controllers/user/banner";
import { authRequest, validateRequest } from "../../../utils/middleware";
import { UserRouteEndPoints, AdminRouteEndPoints } from "../../../enums/user";
import Fileupload from "../../../utils/middleware/multer";

const routes: Router = expres.Router();
const bannerController = new BannerController();

routes.get("/getlist", bannerController.validate(UserRouteEndPoints.Getlist), authRequest, validateRequest, bannerController.getList.bind(bannerController));
routes.get("/getbyid/:id", bannerController.validate(UserRouteEndPoints.Getlimitlist), authRequest, validateRequest, bannerController.getList.bind(bannerController));

export default routes;