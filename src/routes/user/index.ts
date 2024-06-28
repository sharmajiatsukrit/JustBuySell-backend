import expres, { Router } from "express";
import { authAdmin, validateRequest } from "../../utils/middleware";
import AuthRouter from "./auth";
import CatRouter from "./category";
import ProductRouter from "./products";
import Banner from "./banner";
import Mosttradeprojects from "./mosttradeprojects";
import Newlyaddedproducts from "./newlyaddedprojects";
import Productrequest from "./productrequest";
import SearchRouter from "./search";
import Offer from "./postoffer";
import Watchlist from "./watchlist";
import Productwatch from "./productwatch";
import Wallet from "./wallet";
import Deviceid from "./deviceid";
import Location from "./location";

const routes: Router = expres.Router();

routes.use("/category", CatRouter);
routes.use("/products", ProductRouter);
routes.use("/prodductrequest", Productrequest);
routes.use("/banner", Banner);
routes.use("/mosttradeprojects", Mosttradeprojects);
routes.use("/newlyaddedproducts", Newlyaddedproducts);
routes.use("/search", SearchRouter);
routes.use("/Offer", Offer);
routes.use("/watchlist", Watchlist);
routes.use("/productwatch", Productwatch);
routes.use("/wallet", Wallet);
routes.use("/firebase", Deviceid);
routes.use("/location", Location);

export default routes;
