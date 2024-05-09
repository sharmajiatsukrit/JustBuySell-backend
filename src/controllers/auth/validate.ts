import { body, param } from "express-validator";
import { UserRouteEndPoints } from "../../enums/user";

export default function validate(methodName: string) {
    switch (methodName) {
        case UserRouteEndPoints.SignIn:
            return [
                body("email")
                    .exists()
                    .isEmail()
                    .customSanitizer((value) => value && value.toLowerCase()),
                body("password").exists(),
            ];
        case UserRouteEndPoints.ForgetPassword:
            return [
                body("email")
                    .exists()
                    .isEmail()
                    .customSanitizer((value) => value && value.toLowerCase()),
            ];
        case UserRouteEndPoints.ResetPassword:
            return [
                body("email")
                    .exists()
                    .isEmail()
                    .customSanitizer((value) => value && value.toLowerCase()),
                body("password").exists(),
            ];
        case UserRouteEndPoints.ResetOldPassword:
            return [
                body("email")
                    .exists()
                    .isEmail()
                    .customSanitizer((value) => value && value.toLowerCase()),
                body("password").exists(),
                body("oldPassword").exists(),
            ];
        case UserRouteEndPoints.VERIFYEMAIL:
            return [
                body("email")
                    .exists()
                    .isEmail()
                    .customSanitizer((value) => value && value.toLowerCase()),
                body("otp").exists(),
            ];
        case UserRouteEndPoints.Register:
            return [
                body("email").exists().isEmail().customSanitizer((value) => value && value.toLowerCase()),
                body("password").exists(),
                body("first_name").exists(),
                body("last_name").exists(),
            ];
        case UserRouteEndPoints.SocialSignIn:
            return [
                body("email").exists().isEmail().customSanitizer((value) => value && value.toLowerCase()),
                body("social_id").exists(),
                body("type").exists().isInt(),
                // body("first_name").exists(),
                // body("last_name").exists(),
            ];
        default:
            return [];
    }
}
