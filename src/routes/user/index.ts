import expres, { Router } from "express";
import { authAdmin, validateRequest } from "../../utils/middleware";
import AuthRouter from "./auth";
import AuthRoutes from "../user/auth";


import SearchRouter from "./search";
import Deviceid from "./deviceid";

import DashboardRoutes from "./dashboard";
import WatchlistRoutes from "./watchlist";
import OfferRoutes from "./offer";
import AccountRoutes from "../user/account";
import NotificationRoutes from "../user/notification";
import HelperRoutes from "../user/helper";

const routes: Router = expres.Router();
routes.use("/auth", AuthRoutes);
routes.use("/search", SearchRouter);


routes.use("/firebase", Deviceid);

routes.use("/dashboard", DashboardRoutes);
routes.use("/watchlist", WatchlistRoutes);
routes.use("/offer", OfferRoutes);
routes.use("/account", AccountRoutes);
routes.use("/notifications", NotificationRoutes);
routes.use("/helper", HelperRoutes);

export default routes;
