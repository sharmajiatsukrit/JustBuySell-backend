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
routes.get("/get-child-categories/:id", validateRequest, authRequest, dashboardController.getChildCategories.bind(dashboardController));
routes.get("/get-productsby-cat/:id", validateRequest, authRequest, dashboardController.getProductsByCategory.bind(dashboardController));
routes.get("/get-most-searched-products", validateRequest, authRequest, dashboardController.getMostSearchedProducts.bind(dashboardController));
routes.get("/get-most-traded-products", validateRequest, authRequest, dashboardController.getMostTradedProducts.bind(dashboardController));
routes.get("/get-newly-added-products", validateRequest, authRequest, dashboardController.getNewlyAddedProducts.bind(dashboardController));

routes.get("/get-product-by-id/:id", validateRequest, authRequest, dashboardController.getProductByID.bind(dashboardController));
routes.post("/get-buy-offer-by-product/:id", validateRequest, authRequest, dashboardController.getBuyOfferByProductID.bind(dashboardController));
routes.post("/get-sell-offer-by-product/:id", validateRequest, authRequest, dashboardController.getSellOfferByProductID.bind(dashboardController));

routes.get("/get-offer-filters/:product_id", validateRequest, authRequest, dashboardController.getOfferFilters.bind(dashboardController));


export default routes;