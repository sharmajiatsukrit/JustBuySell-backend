import expres, { Router } from "express";
import { authAdmin, validateRequest } from "../../utils/middleware";
import AuthRouter from "./auth";
import CatRouter from "./category";
import ProductRouter from "./products"

const routes: Router = expres.Router();

// routes.use("/pubnub", PubnubRoutes);
routes.use("/auth", AuthRouter);
routes.use("/category", CatRouter);
routes.use("/products", ProductRouter);

export default routes;
