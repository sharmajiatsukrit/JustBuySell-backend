import { Request, Response, NextFunction } from "express";
import { validationResult } from "express-validator";
import { HttpCodeEnum } from "../../enums/server";
import JWT from "jsonwebtoken";
import { fetchSession, fetchSessionlogin } from "../query/session";
import { SessionFetchData, SessionManageData } from "../../interfaces/session";
import { UserAccountStatus } from "../../enums/user";
import ServerMessages, { ServerMessagesEnum } from "../../config/messages";
import Logger from "../logger";

function validateRequest(req: Request, res: Response, next: NextFunction) {
    // Fetch local
    const { locale } = req.query;
    const language = (locale as string) || "en";

    const errors = validationResult(req);

    if (errors.isEmpty()) {
        return next();
    }

    return res.status(HttpCodeEnum.BADREQUEST).json({
        status: false,
        code: HttpCodeEnum.BADREQUEST,
        message: ServerMessages.errorMsgLocale(language, ServerMessagesEnum["required-iv"]),
        data: errors.array(),
    });
}

async function authRequest(req: Request, res: Response, next: NextFunction): Promise<any> {
    try {
        const { authorization } = req.headers;
        const { locale } = req.query;
        const language = (locale as string) || "en";

        if (!authorization) {
            throw new Error(ServerMessages.errorMsgLocale(language, ServerMessagesEnum["user-it"]));
        }

        // Extract token
        const token = authorization.split(" ")[1];
        if (!token) {
            throw new Error(ServerMessages.errorMsgLocale(language, ServerMessagesEnum["user-it"]));
        }

        // Decode token
        if (!process.env.JWT_SECRET) throw new Error("JWT SECRET NOT SPECIFIED");

        let decoded: any;
        try {
            decoded = JWT.verify(token, process.env.JWT_SECRET);
        } catch (err: any) {
            if (err.name === 'TokenExpiredError') {
                throw new Error(ServerMessages.errorMsgLocale(language, ServerMessagesEnum["token-expired"]));
            } else if (err.name === 'JsonWebTokenError') {
                throw new Error(ServerMessages.errorMsgLocale(language, ServerMessagesEnum["token-invalid"]));
            } else {
                throw new Error("Token verification failed");
            }
        }

        const sessionFetchData: SessionFetchData = {
            session_id: decoded.session_id,
            user_id: decoded.user_id,
        };
        

        const tokenSessionData: SessionManageData = await fetchSessionlogin(sessionFetchData);
        if (tokenSessionData.status === UserAccountStatus.Blocked) {
            throw new Error(ServerMessages.errorMsgLocale(language, ServerMessagesEnum["user-bc"]));
        }

        if (tokenSessionData.status === UserAccountStatus.SoftDeleted) {
            throw new Error(ServerMessages.errorMsgLocale(language, ServerMessagesEnum["user-dl"]));
        }
        // tokenSessionData.status === UserAccountStatus.Default this condition is when admin make customer account Inactive
        if (!tokenSessionData.is_valid||tokenSessionData.status === UserAccountStatus.Default) {
            throw new Error(ServerMessages.errorMsgLocale(language, ServerMessagesEnum["user-ua"]));
        }

        req.customer = { object_id: decoded.object_id, user_id: decoded.user_id, phone: decoded.mobile_number, superadmin: false };
        Logger.info("authRequest: user: " + JSON.stringify(req.customer));

        return next();
    } catch (err: any) {

        console.log(err.message);

        const { locale } = req.query;
        const language = (locale as string) || "en";

        if (err.name === "Error") {
            if (err.message === "SESSIONNOTFOUND") {
                err.message = ServerMessages.errorMsgLocale(language, ServerMessagesEnum["user-ua"]);
            }

            return res.status(HttpCodeEnum.UNAUTHORIZED).json({
                status: false,
                code: HttpCodeEnum.UNAUTHORIZED,
                message: err.message || "An error occurred",
                data: [],
            });
        }

        return res.status(HttpCodeEnum.UNAUTHORIZED).json({
            status: false,
            code: HttpCodeEnum.UNAUTHORIZED,
            message: ServerMessages.errorMsgLocale(language, ServerMessagesEnum["user-ua"]),
            data: [],
        });
    }
}

async function authAdmin(req: Request, res: Response, next: NextFunction): Promise<any> {
    try {
        const { authorization } = req.headers;
        const { locale } = req.query;
        const language = (locale as string) || "en";

        if (!authorization) {
            throw new Error(ServerMessages.errorMsgLocale(language, ServerMessagesEnum["user-it"]));
        }

        // Extract token
        const token = authorization.split(" ")[1];
        if (!token) {
            throw new Error(ServerMessages.errorMsgLocale(language, ServerMessagesEnum["user-it"]));
        }

        // Decode and verify token
        if (!process.env.JWT_SECRET) {
            throw new Error("JWT SECRET NOT SPECIFIED");
        }

        let decoded: any;
        try {
            decoded = JWT.verify(token, process.env.JWT_SECRET);
        } catch (err: any) {
            if (err.name === 'TokenExpiredError') {
                throw new Error(ServerMessages.errorMsgLocale(language, ServerMessagesEnum["token-expired"]));
            } else if (err.name === 'JsonWebTokenError') {
                throw new Error(ServerMessages.errorMsgLocale(language, ServerMessagesEnum["token-invalid"]));
            } else {
                throw new Error("Token verification failed");
            }
        }

        const sessionFetchData: SessionFetchData = {
            session_id: decoded.session_id,
            user_id: decoded.user_id,
        };

        const tokenSessionData: SessionManageData = await fetchSession(sessionFetchData);

        if (tokenSessionData.status === UserAccountStatus.Blocked) {
            throw new Error(ServerMessages.errorMsgLocale(language, ServerMessagesEnum["user-bc"]));
        }

        if (tokenSessionData.status === UserAccountStatus.SoftDeleted) {
            throw new Error(ServerMessages.errorMsgLocale(language, ServerMessagesEnum["user-dl"]));
        }

        if (!tokenSessionData.is_valid) {
            throw new Error(ServerMessages.errorMsgLocale(language, ServerMessagesEnum["user-ua"]));
        }

        req.user = { object_id: decoded.object_id, user_id: decoded.user_id, email: decoded.email, superadmin: false };
        Logger.info("authRequest: user: " + JSON.stringify(req.user));

        return next();
    } catch (err: any) {
        const { locale } = req.query;
        const language = (locale as string) || "en";

        let message = ServerMessages.errorMsgLocale(language, ServerMessagesEnum["user-ua"]);

        if (err.name === "Error") {
            if (err.message === "SESSIONNOTFOUND") {
                message = ServerMessages.errorMsgLocale(language, ServerMessagesEnum["user-ua"]);
            } else {
                message = err.message || "An error occurred";
            }
        }

        return res.status(HttpCodeEnum.UNAUTHORIZED).json({
            status: false,
            code: HttpCodeEnum.UNAUTHORIZED,
            message: message,
            data: [],
        });
    }
}

async function interServiceAuth(req: Request, res: Response, next: Function): Promise<any> {
    try {
        const { authorization } = req.headers;

        const { locale } = req.query;
        const language = (locale as string) || "en";

        if (!authorization) {
            throw new Error(ServerMessages.errorMsgLocale(language, ServerMessagesEnum["user-it"]));
        }

        // Extract token
        const token = authorization.split(" ")[1];

        if (token !== process.env.INTER_SERVICE) {
            throw new Error(ServerMessages.errorMsgLocale(language, ServerMessagesEnum["user-it"]));
        }

        return next();
    } catch (err: any) {
        // Fetch local
        const { locale } = req.query;
        const language = (locale as string) || "en";

        if (err.name === "Error") {
            if (err.message === "SESSIONNOTFOUND") {
                err.message = ServerMessages.errorMsgLocale(language, ServerMessagesEnum["user-ua"]);
            }

            return res.status(HttpCodeEnum.UNAUTHORIZED).json({
                status: false,
                code: HttpCodeEnum.UNAUTHORIZED,
                message: err.message || "An error occured",
                data: [],
            });
        }

        return res.status(HttpCodeEnum.UNAUTHORIZED).json({
            status: false,
            code: HttpCodeEnum.UNAUTHORIZED,
            message: ServerMessages.errorMsgLocale(language, ServerMessagesEnum["user-ua"]),
            data: [],
        });
    }
}

export { validateRequest, authRequest, authAdmin, interServiceAuth };
