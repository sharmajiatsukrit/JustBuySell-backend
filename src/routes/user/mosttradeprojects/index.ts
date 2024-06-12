import expres, { Router } from "express";
import ProductRequestController from "../../../controllers/user/mosttradeprojects";
import { UserRouteEndPoints,AdminRouteEndPoints } from "../../../enums/user";
import { authRequest, validateRequest } from "../../../utils/middleware";
import { upload } from "../../../utils/storage";

const routes: Router = expres.Router();
const productcontroller = new ProductRequestController();

routes.get("/get-list", productcontroller.validate(UserRouteEndPoints.Getlist), validateRequest, productcontroller.getList.bind(productcontroller));

export default routes;