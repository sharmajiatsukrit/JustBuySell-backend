import { body, param } from "express-validator";
import { UserRouteEndPoints } from "../../../enums/user";

export default function validate(methodName: string) {
    switch (methodName) {
        case UserRouteEndPoints.SignIn:
            return [
                body("email")
                    .exists()
                    .isEmail()
                    .customSanitizer((value) => value && value.toLowerCase()),
                body("password")
                    .exists()
            ];

        default:
            return [];
    }
}
