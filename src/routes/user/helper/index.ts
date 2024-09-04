import expres, { Router } from "express";
import HelperController from "../../../controllers/user/helper";
import { UserRouteEndPoints, AdminRouteEndPoints } from "../../../enums/user";
import { authRequest, validateRequest } from "../../../utils/middleware";
import { upload } from "../../../utils/storage";

const routes: Router = expres.Router();
const helperController = new HelperController();

routes.get("/get-my-profile", validateRequest, authRequest, helperController.getMyProfile.bind(helperController));

routes.post("/request-new-product", validateRequest, authRequest, upload.single("product_image"), helperController.requestNewProduct.bind(helperController));
routes.post("/add-to-watchlist", validateRequest, authRequest, helperController.addToWatchlist.bind(helperController));
routes.post("/remove-from-watchlist", validateRequest, authRequest, helperController.removeFromWatchlist.bind(helperController));

routes.get("/get-products-by-cat/:cat_id", validateRequest, authRequest, helperController.getProductsByCat.bind(helperController));

export default routes;