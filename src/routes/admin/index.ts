import expres, { Router } from "express";
import { authAdmin, validateRequest } from "../../utils/middleware";
import UsersRoutes from "./users";
import RolesRoutes from "./roles";
import PermissionsRoutes from "./permissions";
import CountryRoutes from "./country";
import StateRoutes from "./states";
import CityRoutes from "./cities";
import CategoryRoutes from "./category";
import ProductsRoutes from "./products";
import UnitsRoutes from "./unit";
import HelperRoutes from "./helper";
const routes: Router = expres.Router();

// routes.use("/pubnub", PubnubRoutes);
routes.use("/users", UsersRoutes);
routes.use("/roles", RolesRoutes);
routes.use("/permissions", PermissionsRoutes);
routes.use("/country", CountryRoutes);
routes.use("/state", StateRoutes);
routes.use("/city", CityRoutes);
routes.use("/units", UnitsRoutes);

routes.use("/category", CategoryRoutes);
routes.use("/product", ProductsRoutes);
routes.use("/helper", HelperRoutes);
export default routes;
