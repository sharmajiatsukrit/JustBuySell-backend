import expres, { Router } from "express";
import WatchController from "../../../controllers/user/watchlist";
import { UserRouteEndPoints, AdminRouteEndPoints } from "../../../enums/user";
import { authRequest, validateRequest } from "../../../utils/middleware";
import { upload } from "../../../utils/storage";

const routes: Router = expres.Router();
const watchController = new WatchController();

routes.get("/list", watchController.validate(UserRouteEndPoints.Getsearch), authRequest, validateRequest, watchController.getList.bind(watchController));
routes.get("/by-id/:id", watchController.validate(UserRouteEndPoints.Getsearch), authRequest, validateRequest, watchController.getById.bind(watchController));
routes.post("/add", watchController.validate(UserRouteEndPoints.Getsearch), authRequest, validateRequest, watchController.add.bind(watchController));
routes.put("/update/:id", watchController.validate(UserRouteEndPoints.Getsearch), authRequest, validateRequest, watchController.update.bind(watchController));
routes.delete("/delete/:id", watchController.validate(UserRouteEndPoints.Getsearch), authRequest, validateRequest, watchController.delete.bind(watchController));

routes.get("/products/by-id/:id", watchController.validate(UserRouteEndPoints.Getsearch), authRequest, validateRequest, watchController.getProductsByWatchlistId.bind(watchController));

export default routes;