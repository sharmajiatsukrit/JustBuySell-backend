import expres, { Router } from "express";
import SearchController from "../../../controllers/user/search";
import { UserRouteEndPoints,AdminRouteEndPoints } from "../../../enums/user";
import { authRequest, validateRequest } from "../../../utils/middleware";
import { upload } from "../../../utils/storage";

const routes: Router = expres.Router();
const searchController = new SearchController(); 

routes.get("/bysearch", searchController.validate(UserRouteEndPoints.Getsearch), authRequest, validateRequest, searchController.getSearch.bind(searchController));

export default routes;