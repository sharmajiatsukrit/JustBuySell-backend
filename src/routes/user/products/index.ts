import expres, { Router } from "express";
import ProductRequestController from "../../../controllers/user/products";
import { UserRouteEndPoints,AdminRouteEndPoints } from "../../../enums/user";
import { authRequest, validateRequest } from "../../../utils/middleware";
import { upload } from "../../../utils/storage";

const routes: Router = expres.Router();
const productcontroller = new ProductRequestController();

routes.get("/get-list", productcontroller.validate(UserRouteEndPoints.Getlist), validateRequest, productcontroller.getList.bind(productcontroller));
routes.get("/search", productcontroller.validate(UserRouteEndPoints.Getsearch), validateRequest, productcontroller.getSearch.bind(productcontroller));
routes.post("/add", productcontroller.validate(UserRouteEndPoints.Addproductrequest), validateRequest, productcontroller.add.bind(productcontroller));

export default routes;