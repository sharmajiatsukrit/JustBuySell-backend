import expres, { Router } from "express";
import { authAdmin, validateRequest } from "../../utils/middleware";
import AuthRouter from "./auth";
import CatRouter from "./category";
import ProductRouter from "./products";
import Banner from "./banner";
import Mosttradeprojects from "./mosttradeprojects";
import Newlyaddedproducts from "./newlyaddedprojects";
import Productrequest from "./productrequest";

const routes: Router = expres.Router();

routes.use("/category", CatRouter);
routes.use("/products", ProductRouter);
routes.use("/prodductrequest", Productrequest);
routes.use("/banner", Banner);
routes.use("/mosttradeprojects", Mosttradeprojects);
routes.use("/newlyaddedproducts", Newlyaddedproducts);

export default routes;
