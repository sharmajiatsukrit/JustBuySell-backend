import expres, { Router } from "express";
import AuthController from "../../../controllers/admin/auth";
import { UserRouteEndPoints, AdminRouteEndPoints } from "../../../enums/user";
import { authRequest, validateRequest } from "../../../utils/middleware";


const routes: Router = expres.Router();
const authController = new AuthController();

routes.post("/signin", authController.validate(AdminRouteEndPoints.SignIn), validateRequest, authController.signIn.bind(authController));
routes.post("/register", authController.validate(AdminRouteEndPoints.Register), validateRequest, authController.Register.bind(authController));

routes.get("/auth-check", authRequest, authController.authCheck.bind(authController));
routes.get("/refresh-token", authRequest, authController.refreshUserToken.bind(authController));
routes.get("/signout", authRequest, authController.signOut.bind(authController));


export default routes;
