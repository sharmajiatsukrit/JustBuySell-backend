import expres, { Router } from "express";
import WatchController from "../../../controllers/user/watchlist";
import { UserRouteEndPoints,AdminRouteEndPoints } from "../../../enums/user";
import { authRequest, validateRequest } from "../../../utils/middleware";
import { upload } from "../../../utils/storage";

const routes: Router = expres.Router();
const watchController = new WatchController(); 

routes.get("/getList", watchController.validate(UserRouteEndPoints.Getsearch), authRequest, validateRequest, watchController.getList.bind(watchController));
routes.get("/getbyid/:id", watchController.validate(UserRouteEndPoints.Getsearch), authRequest, validateRequest, watchController.getbyid.bind(watchController));
routes.post("/addwatchlist", watchController.validate(UserRouteEndPoints.Getsearch), authRequest, validateRequest, watchController.addWatchlist.bind(watchController));
routes.patch("/editwatchlist/:id", watchController.validate(UserRouteEndPoints.Getsearch), authRequest, validateRequest, watchController.editWatchlist.bind(watchController));
routes.delete("/deletewatchlist/:id", watchController.validate(UserRouteEndPoints.Getsearch), authRequest, validateRequest, watchController.deleteWatchlist.bind(watchController));

export default routes;