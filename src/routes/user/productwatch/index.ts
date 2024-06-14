import expres, { Router } from "express";
import Productwatvhlist from "../../../controllers/user/productwatchlist";
import { UserRouteEndPoints,AdminRouteEndPoints } from "../../../enums/user";
import { authRequest, validateRequest } from "../../../utils/middleware";
import { upload } from "../../../utils/storage";

const routes: Router = expres.Router();
const productwatvhlist = new Productwatvhlist();

routes.get("/getList", productwatvhlist.validate(UserRouteEndPoints.Getsearch), authRequest, validateRequest, productwatvhlist.getList.bind(productwatvhlist));
routes.get("/getbyid/:id", productwatvhlist.validate(UserRouteEndPoints.Getsearch), authRequest, validateRequest, productwatvhlist.getbyid.bind(productwatvhlist));
routes.post("/addproductwatch", productwatvhlist.validate(UserRouteEndPoints.Getsearch), authRequest,  validateRequest, productwatvhlist.addProductWatch.bind(productwatvhlist));
routes.patch("/editproductwatch/:id", productwatvhlist.validate(UserRouteEndPoints.Getsearch), authRequest,  validateRequest, productwatvhlist.editproductWatch.bind(productwatvhlist));
routes.delete("/deletewatchlist/:id", productwatvhlist.validate(UserRouteEndPoints.Getsearch), authRequest, validateRequest, productwatvhlist.deleteWatchlist.bind(productwatvhlist));

export default routes;