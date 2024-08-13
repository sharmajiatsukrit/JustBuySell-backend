import expres, { Router } from "express";
import DashboardController from "../../../controllers/user/dashboard";
import { UserRouteEndPoints, AdminRouteEndPoints } from "../../../enums/user";
import { authRequest, validateRequest } from "../../../utils/middleware";
import { upload } from "../../../utils/storage";

const routes: Router = expres.Router();
const dashboardController = new DashboardController();

routes.get("/search", validateRequest, authRequest, dashboardController.getSearch.bind(dashboardController));
routes.get("/get-banners", validateRequest, authRequest, dashboardController.getBanners.bind(dashboardController));
routes.get("/get-top-categories", validateRequest, authRequest, dashboardController.getTopCategories.bind(dashboardController));
routes.get("/get-most-searched-products", validateRequest, authRequest, dashboardController.getMostSearchedProducts.bind(dashboardController));
routes.get("/get-most-traded-products", validateRequest, authRequest, dashboardController.getMostTradedProducts.bind(dashboardController));
routes.get("/get-newly-added-products", validateRequest, authRequest, dashboardController.getNewlyAddedProducts.bind(dashboardController));


export default routes;