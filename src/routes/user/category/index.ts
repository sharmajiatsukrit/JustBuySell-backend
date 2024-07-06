import expres, { Router } from "express";
import categoryController from "../../../controllers/user/category";
import { UserRouteEndPoints, AdminRouteEndPoints } from "../../../enums/user";
import { authRequest, validateRequest } from "../../../utils/middleware";
import { upload } from "../../../utils/storage";

const routes: Router = expres.Router();
const categorycontroller = new categoryController();

routes.get("/list", categorycontroller.validate(UserRouteEndPoints.Getlist), authRequest, validateRequest, categorycontroller.getList.bind(categorycontroller));
//routes.get("/get-limit-list", categorycontroller.validate(UserRouteEndPoints.Getlimitlist), authRequest, validateRequest, categorycontroller.getLimitlist.bind(categorycontroller));


export default routes;