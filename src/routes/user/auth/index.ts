import expres, { Router } from "express";
import AuthController from "../../../controllers/user/auth";
import { UserRouteEndPoints, AdminRouteEndPoints } from "../../../enums/user";
import { authRequest, validateRequest } from "../../../utils/middleware";
import { upload } from "../../../utils/storage";

const routes: Router = expres.Router();
const authController = new AuthController();

// Applied authRequest to protect from misuse
routes.post("/signin", authController.validate(UserRouteEndPoints.SignIn), validateRequest, authController.signIn.bind(authController));
routes.post("/verify-otp", authController.validate(UserRouteEndPoints.Verifyotplogin), validateRequest, authController.verifyLoginOTP.bind(authController));

routes.post("/forgetpassword", authController.validate(UserRouteEndPoints.ForgetPassword), validateRequest, authController.forgetPassword.bind(authController));
routes.post("/sendotp", authController.validate(UserRouteEndPoints.ForgetPassword), validateRequest, authController.sendOtpMail.bind(authController));
routes.post("/verifyemail", authController.validate(UserRouteEndPoints.VERIFYEMAIL), validateRequest, authController.verifyEmailId.bind(authController));
routes.post("/resetpassword", authController.validate(UserRouteEndPoints.ResetPassword), validateRequest, authController.resetPassword.bind(authController));

routes.get("/auth-check", authRequest, authController.authCheck.bind(authController));
routes.get("/refresh-token", authRequest, authController.refreshUserToken.bind(authController));
routes.get("/signout", authRequest, authController.signOut.bind(authController));
routes.patch("/update-geo-coordinates", validateRequest, authRequest, authController.updateCoordinates.bind(authController));
routes.patch("/update-device", validateRequest, authRequest, authController.addUpdateDevice.bind(authController));
export default routes;
