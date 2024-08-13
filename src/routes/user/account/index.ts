import expres, { Router } from "express";
import AccountController from "../../../controllers/user/account";
import { UserRouteEndPoints, AdminRouteEndPoints } from "../../../enums/user";
import { authRequest, validateRequest } from "../../../utils/middleware";
import { upload } from "../../../utils/storage";

const routes: Router = expres.Router();
const accountController = new AccountController();

routes.get("/get-my-profile", validateRequest, authRequest, accountController.getMyProfile.bind(accountController));
routes.put("/update-profile", validateRequest, authRequest, upload.single("company_logo"), accountController.updateMyProfile.bind(accountController));

export default routes;