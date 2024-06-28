import expres, { Router } from "express";
import AuthController from "../../../controllers/user/auth";
import { UserRouteEndPoints,AdminRouteEndPoints } from "../../../enums/user";
import { authRequest, validateRequest } from "../../../utils/middleware";
import { upload } from "../../../utils/storage";

const routes: Router = expres.Router();
const authController = new AuthController();

// Applied authRequest to protect from misuse
routes.post("/user/signin", authController.validate(UserRouteEndPoints.SignIn), validateRequest, authController.signIn.bind(authController));
routes.post("/user/login", authController.validate(UserRouteEndPoints.Login), validateRequest, authController.login.bind(authController));
routes.post("/user/verify-otp", authController.validate(UserRouteEndPoints.VERIFYEMAIL), validateRequest, authController.verifyOtplogin.bind(authController));
routes.post("/user/register", authController.validate(UserRouteEndPoints.Register), validateRequest, authController.register.bind(authController));
// routes.post("/signin/social", authController.validate(UserRouteEndPoints.SocialSignIn), validateRequest, authController.socialSignIn.bind(authController));
routes.post("/user/forgetpassword", authController.validate(UserRouteEndPoints.ForgetPassword), validateRequest, authController.forgetPassword.bind(authController));
routes.post("/user/sendotp", authController.validate(UserRouteEndPoints.ForgetPassword), validateRequest, authController.sendOtpMail.bind(authController));
routes.post("/user/verifyemail", authController.validate(UserRouteEndPoints.VERIFYEMAIL), validateRequest, authController.verifyEmailId.bind(authController));
routes.post("/user/resetpassword", authController.validate(UserRouteEndPoints.ResetPassword), validateRequest, authController.resetPassword.bind(authController));
routes.post("/", authRequest, authController.register.bind(authController));
routes.get("/user/auth-check", authRequest, authController.authCheck.bind(authController));
routes.get("/user/refresh-token", authRequest, authController.refreshUserToken.bind(authController));
routes.get("/user/signout", authRequest, authController.signOut.bind(authController));

//Admin auth
routes.post("/admin/signin", authController.validate(AdminRouteEndPoints.SignIn), validateRequest, authController.adminSignIn.bind(authController));


export default routes;
