import { Request, Response } from "express";
import { ValidationChain } from "express-validator";
import validator from "validator";
import Bcrypt from "bcryptjs";
import mongoose from "mongoose";
import JWT from "jsonwebtoken";
import { DateTime } from "luxon";
import moment from "moment";
import { Otps, Permissions, Sessions, User } from "../../../models";
import { removeObjectKeys, serverResponse, getDeviceDetails, serverErrorHandler, decryptText, removeSpace, constructResponseMsg, serverInvalidRequest } from "../../../utils";
import { HttpCodeEnum } from "../../../enums/server";
import { UserData } from "../../../interfaces/user";
import { updateSeesionWithIpInfo } from "../../../utils/query";
import validate from "./validate";
import { SessionManageData } from "../../../interfaces/session";
// import { getSubscriberData, getUserEncryptedData } from "../../utils/query/subscriber";
import EmailService from "../../../utils/email";
import { SocialType, UserInviteType, UserPermssionType } from "../../../enums/user";
import { SubscriberType } from "../../../enums/subscriber";
import Logger from "../../../utils/logger";
import ServerMessages, { ServerMessagesEnum } from "../../../config/messages";
import { uploadFile, deleteFile } from "../../../utils/storage";
import { postSoftDelete } from "../../../services/Chat";

const fileName = "[user][index.ts]";
export default class AuthController {
    public locale: string = "en";
    public emailService;

    constructor() {
        this.emailService = new EmailService();
    }

    public validate(endPoint: string): ValidationChain[] {
        return validate(endPoint);
    }

    public async signIn(req: Request, res: Response): Promise<any> {
        const fn = "[adminSignIn]";

        try {
            const { locale = "en" } = req.query;
            this.locale = locale as string;

            let { email, password, remember = true } = req.body;

            // Remove spaces from email
            email = removeSpace(email);

            // Check if user exists
            const user = await User.findOne({ email });
            if (!user) {
                throw new Error(constructResponseMsg(this.locale, "user-not-found"));
            }

            // Verify password
            const isPasswordValid = await Bcrypt.compare(password, user.password);
            if (!isPasswordValid) {
                throw new Error(constructResponseMsg(this.locale, "invalid-password"));
            }

            // Fetch user details (assuming fetchUserDetails and createSession are defined elsewhere in your class)
            const formattedUserData = await this.fetchUserDetails(user.id);
            const session = await this.createSessionadminLogin(user._id, user.id, email, req, user.status, remember);

            if (session) {
                formattedUserData.token = session.token;
            }

            // Return successful response
            return serverResponse(res, HttpCodeEnum.OK, constructResponseMsg(this.locale, "logged-in"), formattedUserData);
        } catch (err: any) {
            console.error(`${fn} Error: ${err.message}`);
            return serverErrorHandler(err, res, err.message, HttpCodeEnum.SERVERERROR, {});
        }
    }

    public async Register(req: Request, res: Response): Promise<any> {
        try {
            const fn = "[register]";
            const { locale } = req.query;
            this.locale = (locale as string) || "en";

            const { name, phone, email, password } = req.body;

            const isUserExists = await this.getExistingUser(email);

            // Validate email
            const isValidEmail = validator.isEmail(email);

            if (!isValidEmail) {
                throw new Error(constructResponseMsg(this.locale, "email-iv"));
            }

            // const dePassword = decryptText(password);
            const dePassword = password;

            if (!dePassword) {
                throw new Error(constructResponseMsg(this.locale, "invalid-password"));
            }

            const hashedPassword: string = Bcrypt.hashSync(dePassword, 10);
            let userData: any;

            if (!isUserExists) {
                userData = await User.create({
                    name: name,
                    phone: phone,
                    email: email,
                    password: hashedPassword,
                    status: true
                });
            } else {
                userData = {
                    _id: isUserExists._id,
                    id: isUserExists.id,
                    email: isUserExists.email,
                    status: true
                };
            }

            const formattedUserData = await this.fetchUserDetails(userData.id);
            const session = await this.createSession(userData._id, userData.id, email, req, userData.status, false);
            // const otp = await this.generateOtp(userData.id);
            // this.emailService.otpEmail(userData.email, otp);

            if (session) {
                formattedUserData.token = session.token;
            }

            return serverResponse(res, HttpCodeEnum.OK, constructResponseMsg(this.locale, "user-os"), formattedUserData);
        } catch (err: any) {
            return serverErrorHandler(err, res, err.message, HttpCodeEnum.SERVERERROR, {});
        }
    }

    public async signOut(req: Request, res: Response): Promise<any> {
        try {
            const fn = "[signOut]";
            const { user_id } = req.user;
            const authId = req.headers.authorization;
            const token = authId?.split(" ")[1];
            const userData = await Sessions.deleteOne({ user_id: user_id, token: token });

            if (userData.deletedCount === 0) {
                throw new Error(constructResponseMsg(this.locale, "user-ns"));
            }

            return serverResponse(res, HttpCodeEnum.OK, constructResponseMsg(this.locale, "user-lo"), {});
        } catch (err: any) {
            return serverErrorHandler(err, res, err.message, HttpCodeEnum.SERVERERROR, {});
        }
    }
    private async getExistingUser(email: string): Promise<any> {
        // Search on encrypted email field
        const messageToSearchWith: any = new User({ email });
        messageToSearchWith.encryptFieldsSync();

        const userData: any = await User.findOne({ "$or": [{ email: messageToSearchWith.email }] });

        if (userData) {
            return Promise.resolve(userData._doc);
        }

        return Promise.resolve(false);
    }

    // Checked with encryption
    private async createSession(object_id: any, user_id: number, mobile_number: number, req: Request, status: number, remember: boolean) {
        const session = await mongoose.startSession();
        session.startTransaction();

        try {
            if (!process.env.JWT_SECRET) {
                throw new Error("JWT secret key undefined");
            }

            const ipAddress: string = (req.headers["X-Forwarded-For"] as string) || "";
            const deviceDetails = getDeviceDetails(req);
            const expiresIn = DateTime.now().plus({ days: (remember) ? 30 : 1 }).toISO();

            const sessionData = await Sessions.create({
                user_id,
                status: true,
                ip: ipAddress,
                device_type: deviceDetails.device_type,
                device_os: deviceDetails.device_os,
                device_info: deviceDetails,
                expires_in: expiresIn,
                last_used: DateTime.now().toISO(),
            });

            const token: string = JWT.sign(
                {
                    object_id,
                    mobile_number,
                    user_id,
                    session_id: sessionData.id
                },
                process.env.JWT_SECRET,
                {
                    expiresIn: (remember) ? "30d" : "1d",
                }
            );

            sessionData.token = token;
            await sessionData.save();

            // Store session cache
            const dbDataBuild: SessionManageData = {
                session_id: sessionData.id,
                user_id: sessionData.user_id,
                token: token,
                status: status,
                is_valid: sessionData.status,
            };

            updateSeesionWithIpInfo(sessionData.id, ipAddress);
            await session.commitTransaction();
            return sessionData;
        } catch (err: any) {
            session.abortTransaction();
            session.endSession();
            return Promise.reject(err);
        }
    }

    private async createSessionadminLogin(object_id: any, user_id: number, email: string, req: Request, status: number, remember: boolean) {
        const session = await mongoose.startSession();
        session.startTransaction();

        try {
            if (!process.env.JWT_SECRET) {
                throw new Error("JWT secret key undefined");
            }

            const ipAddress: string = (req.headers["X-Forwarded-For"] as string) || "";
            const deviceDetails = getDeviceDetails(req);
            const expiresIn = DateTime.now().plus({ days: (remember) ? 30 : 1 }).toISO();

            const sessionData = await Sessions.create({
                user_id,
                status: true,
                ip: ipAddress,
                device_type: deviceDetails.device_type,
                device_os: deviceDetails.device_os,
                device_info: deviceDetails,
                expires_in: expiresIn,
                last_used: DateTime.now().toISO(),
            });

            const token: string = JWT.sign(
                {
                    object_id,
                    email,
                    user_id,
                    session_id: sessionData.id
                },
                process.env.JWT_SECRET,
                {
                    expiresIn: (remember) ? "30d" : "1d",
                }
            );

            sessionData.token = token;
            await sessionData.save();

            // Store session cache
            const dbDataBuild: SessionManageData = {
                session_id: sessionData.id,
                user_id: sessionData.user_id,
                token: token,
                status: status,
                is_valid: sessionData.status,
            };

            updateSeesionWithIpInfo(sessionData.id, ipAddress);
            await session.commitTransaction();
            return sessionData;
        } catch (err: any) {
            session.abortTransaction();
            session.endSession();
            return Promise.reject(err);
        }
    }

    // Checked
    public async authCheck(req: Request, res: Response) {
        try {
            return res.status(HttpCodeEnum.OK).json({
                status: true,
                code: HttpCodeEnum.OK,
                message: "Token valid",
                data: [],
            });
        } catch (err: any) {
            return serverErrorHandler(err, res, err.message);
        }
    }

    // Checked with encryption
    public async fetchUserDetails(userId: number, billing = "") {
        try {
            const userData: any = await User.findOne({ id: userId }, { password: false, account_status: false, subscribed_to: false });

            delete userData._doc.__enc_email;
            delete userData._doc.__enc_communication_email;
            delete userData._doc.__enc_mobile_number;
            delete userData._doc.__enc_city;

            if (!userData) {
                throw new Error(constructResponseMsg(this.locale, "user-nf"));
            }

            userData._doc.user_date_format = userData._doc.date_format;
            userData._doc.user_time_format = (userData._doc.time_format === "24") ? "HH:mm" : "hh:mm a";
            userData._doc.user_date_time_format = userData._doc.user_date_format + " " + userData._doc.user_time_format;



            // const fetchSubscriberData = await Promise.all(subscribedDetailData);
            const formattedUserData: any = userData._doc;

            return Promise.resolve(formattedUserData);
        } catch (err: any) {
            return Promise.reject(err);
        }
    }


    // UnChecked
    public async refreshUserToken(req: Request, res: Response): Promise<any> {
        try {
            const fn = "[refreshToken]";
            const { user_id } = req.user;
            const { locale } = req.query;
            this.locale = (locale as string) || "en";
            const authId: any = req.headers.authorization?.split(" ");
            Logger.info(`${fileName + fn} user_id: ${user_id}`);

            const currentToken: any = await Sessions.findOne({ user_id: user_id, token: authId[1] }, { id: true }).lean();
            const formattedUserData: any = await this.fetchUserDetails(user_id);
            const session: any = await this.createSession(formattedUserData._id, formattedUserData.id, formattedUserData.communication_email, req, formattedUserData.account_status, true);
            await Sessions.deleteOne({ id: currentToken.id });

            return serverResponse(res, HttpCodeEnum.OK, constructResponseMsg(this.locale, "token-ref"), { "token": session.token });
        } catch (err: any) {
            return serverErrorHandler(err, res, err.message, HttpCodeEnum.SERVERERROR, {});
        }
    }






}