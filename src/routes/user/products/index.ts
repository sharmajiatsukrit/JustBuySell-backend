import expres, { Router } from "express";
import ProductRequestController from "../../../controllers/user/products";
import { UserRouteEndPoints,AdminRouteEndPoints } from "../../../enums/user";
import { authRequest, validateRequest } from "../../../utils/middleware";
import { upload } from "../../../utils/storage";

const routes: Router = expres.Router();
const productcontroller = new ProductRequestController();

routes.get("/list", productcontroller.validate(UserRouteEndPoints.Getlist), authRequest, validateRequest, productcontroller.getList.bind(productcontroller));
routes.get("/getbyid/:id", productcontroller.validate(UserRouteEndPoints.Getlist), authRequest, validateRequest, productcontroller.getbyid.bind(productcontroller));
routes.get("/getbycategory/:id", productcontroller.validate(UserRouteEndPoints.Getlist), authRequest, validateRequest, productcontroller.getbycategory.bind(productcontroller));

export default routes;