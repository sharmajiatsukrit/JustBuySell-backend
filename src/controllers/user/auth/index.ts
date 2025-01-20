import { Request, Response } from "express";
import { ValidationChain } from "express-validator";
import validator from "validator";
import Bcrypt from "bcryptjs";
import mongoose from "mongoose";
import JWT from "jsonwebtoken";
import { DateTime } from "luxon";
import moment from "moment";
import { Otps, Permissions, Sessions, User, Customer, Deviceid, Setting, Wallet, Transaction } from "../../../models";
import { removeObjectKeys, serverResponse, getDeviceDetails, serverErrorHandler, decryptText, removeSpace, constructResponseMsg, serverInvalidRequest } from "../../../utils";
import { HttpCodeEnum } from "../../../enums/server";
import { UserData } from "../../../interfaces/user";
import { updateSeesionWithIpInfo } from "../../../utils/query";
import { sendSMS } from "../../../utils/pinnacle";
import validate from "./validate";
import { SessionManageData } from "../../../interfaces/session";
// import { getSubscriberData, getUserEncryptedData } from "../../utils/query/subscriber";
import EmailService from "../../../utils/email";
import { SocialType, UserInviteType, UserPermssionType } from "../../../enums/user";
import { SubscriberType } from "../../../enums/subscriber";
import Logger from "../../../utils/logger";
import ServerMessages, { ServerMessagesEnum } from "../../../config/messages";
import { uploadFile, deleteFile } from "../../../utils/storage";
import { networkRequest } from "../../../utils/request";
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

    // Customer  start
    // login
    public async signIn(req: Request, res: Response): Promise<any> {
        try {
            const fn = "[login]";
            const { locale } = req.query;
            this.locale = (locale as string) || "en";

            const { phone } = req.body;
            if (!phone) {
                throw new Error(constructResponseMsg(this.locale, "phone-number-required"));
            }

            let userData = await Customer.findOne({ phone });

            if (!userData) {
                // User does not exist, register the user
                const newUser = await Customer.create({ phone: phone,parent_id:null,status:1 });
                const settings:any = await Setting.findOne({ key: "customer_settings" }).lean();
                const reachare: any = await Wallet.create({
                    balance: settings.value.new_registration_topup,
                    customer_id: newUser._id
                });

                const transaction: any = await Transaction.create({
                    amount: settings.value.new_registration_topup,
                    gst: 0,
                    transaction_id: '',
                    razorpay_payment_id: '',
                    status: 1,
                    remarks: "Free registration TOPUP",
                    customer_id: newUser._id
                });
                userData = newUser;
            }

            // Generate OTP for the user
            const otp = await this.generateOtp(userData.id);
            const mess = await sendSMS(phone,`${otp} is OTP for JustBuySell login. Keep this code secure and do not share it with anyone.`);
            // console.log(mess.data);
            return serverResponse(res, HttpCodeEnum.OK, constructResponseMsg(this.locale, "otp-sent"), mess.data);

        } catch (err: any) {
            return serverErrorHandler(err, res, err.message, HttpCodeEnum.SERVERERROR, {});
        }
    }

    public async verifyLoginOTP(req: Request, res: Response): Promise<any> {
        try {
            const fn = "[verifyOtpForForgetPassword]";
            // Set locale
            const { locale } = req.query;
            this.locale = (locale as string) || "en";

            // Req Body
            const { phone, otp, remember = true } = req.body;

            const userData = await Customer.findOne({ phone });

            if (!userData) {
                throw new Error(constructResponseMsg(this.locale, "user-nf"));
            }

            const verifyOtp = await this.verifyOtp(userData.id, otp);

            if (!verifyOtp) {
                throw new Error(constructResponseMsg(this.locale, "in-otp"));
            }

            const formattedUserData = await this.fetchUserDetails(userData.id);
            const session = await this.createSession(userData._id, userData.id, phone, req, userData.status, remember);

            if (session) {
                formattedUserData.token = session.token;
            }

            return serverResponse(res, HttpCodeEnum.OK, constructResponseMsg(this.locale, "otp-verified"), formattedUserData);
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


    // Customer  start

    // Checked with encryption
    private async generateOtp(userId: number): Promise<number> {
        const minNo = 100000;
        const maxNo = 999999;
        const otp = 123456;//Math.floor(Math.random() * (maxNo - minNo + 1)) + minNo;
        const hashedOtp = await Bcrypt.hash(otp.toString(), 10);

        const isOTPExist = await Otps.where({ user_id: userId }).countDocuments();

        const otpValidDate = moment().add(10, 'minutes');
        // networkRequest('POST', url: string, data = {}, headers = {});
        if (!isOTPExist) {
            await Otps.create({
                user_id: userId,
                otp: hashedOtp,
                valid_till: otpValidDate
            });
        } else {
            await Otps.findOneAndUpdate({ user_id: userId }, {
                otp: hashedOtp,
                valid_till: otpValidDate
            });
        }

        return Promise.resolve(otp);
    }

    // Checked with encryption
    private async verifyOtp(userId: number, otp: number): Promise<boolean> {
        const otpFromDB = await Otps.findOne({ user_id: userId }).lean();

        if (!otpFromDB) {
            return Promise.resolve(false);
        }
        const isValidOtp = moment(otpFromDB.valid_till).diff(moment(), 'minutes') > 0 && await Bcrypt.compare(otp.toString(), otpFromDB.otp);

        if (!isValidOtp) {
            return Promise.resolve(false);
        }

        await Otps.deleteMany({ user_id: userId });
        return Promise.resolve(true);
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
            const userData: any = await Customer.findOne({ id: userId }, { password: false, account_status: false, subscribed_to: false });

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



    // Checked with encryption
    private async checkIfUserExists(email: string): Promise<Boolean> {
        // Search on encrypted email field
        const emailToSearchWith: any = new User({ email: removeSpace(email) });
        emailToSearchWith.encryptFieldsSync();

        const isUserExist: any = await User.findOne({ is_email_verified: true, "$or": [{ email: emailToSearchWith.email }, { communication_email: emailToSearchWith.email }] });

        if (isUserExist) {
            // const socialData: any = await Socials.find({ email: emailToSearchWith.email });

            // if (socialData.length > 0) {
            //     if (socialData[0].type === SocialType.apple) {
            //         throw new Error(constructResponseMsg(this.locale, "existing-account-apple"));
            //     }
            // }

            return Promise.resolve(true);
        }

        return Promise.resolve(false);
    }

    // Checked with encryption
    private async getExistingUser(email: string): Promise<any> {
        // Search on encrypted email field
        const messageToSearchWith: any = new User({ email });
        messageToSearchWith.encryptFieldsSync();

        const userData: any = await User.findOne({ "$or": [{ email: messageToSearchWith.email }, { communication_email: messageToSearchWith.email }] });

        if (userData) {
            return Promise.resolve(userData._doc);
        }

        return Promise.resolve({ is_email_verified: false });
    }


    public async getUserDetails(req: Request, res: Response): Promise<any> {
        try {
            const fn = "[getUserDetails]";
            const { user_id } = req.user;

            // Set locale
            const { locale } = req.query;
            const billing: any = req.query.billing || "0"

            this.locale = (locale as string) || "en";
            Logger.info(`${fileName + fn} user_id: ${user_id}`);
            const userData = await this.fetchUserDetails(user_id, billing);

            // userData.email = userData.email.split("@")[1] !== "socialemailnotfound.com" ? userData.email : null; 

            return serverResponse(res, HttpCodeEnum.OK, constructResponseMsg(this.locale, "user-ds"), userData);
        } catch (err: any) {
            return serverErrorHandler(err, res, err.message, HttpCodeEnum.SERVERERROR, {});
        }
    }

    public async forgetPassword(req: Request, res: Response): Promise<any> {
        try {
            const fn = "[forgetPassword]";
            // Set locale
            const { locale } = req.query;
            this.locale = (locale as string) || "en";

            // Req Body
            const email = removeSpace(req.body.email);
            // Logger.info(`${fileName + fn} req.body: ${JSON.stringify(req.body)}`);

            // Search on encrypted email field
            const emailToSearchWith: any = new User({ email });
            emailToSearchWith.encryptFieldsSync();

            const userData: any = await User.findOne({ $or: [{ email: emailToSearchWith.email }, { communication_email: emailToSearchWith.email }] });

            if (!userData) {
                throw new Error(constructResponseMsg(this.locale, "user-nf"));
            }

            const otp = await this.generateOtp(userData._doc.id);
            // this.emailService.otpEmail(userData.email, otp);

            return serverResponse(res, HttpCodeEnum.OK, constructResponseMsg(this.locale, "fpi-e"), {});
        } catch (err: any) {
            return serverErrorHandler(err, res, err.message, HttpCodeEnum.SERVERERROR, {});
        }
    }

    public async sendOtpMail(req: Request, res: Response): Promise<any> {
        try {
            const fn = "[sendOtpMail]";

            // Set locale
            const { locale } = req.query;
            this.locale = (locale as string) || "en";

            // Req Body
            const email = removeSpace(req.body.email);
            // Logger.info(`${fileName + fn} req.body: ${JSON.stringify(req.body)}`);

            // Search on encrypted email field
            const emailToSearchWith: any = new User({ email });
            emailToSearchWith.encryptFieldsSync();

            const userExist: any = await User.findOne({ $or: [{ email: emailToSearchWith.email }, { communication_email: emailToSearchWith.email }] });
            // if (userExist) {
            //     throw new Error(constructResponseMsg(this.locale, "email-ae"));
            // }

            const otp = await this.generateOtp(userExist._doc.id);
            // this.emailService.otpEmail(email, otp);

            return serverResponse(res, HttpCodeEnum.OK, constructResponseMsg(this.locale, "fpi-e"), {});
        } catch (err: any) {
            return serverErrorHandler(err, res, err.message, HttpCodeEnum.SERVERERROR, {});
        }
    }

    // Checked with encryption
    public async verifyEmailId(req: Request, res: Response): Promise<any> {
        try {
            const fn = "[verifyEmailId]";
            // Set locale
            const { locale } = req.query;
            this.locale = (locale as string) || "en";

            // Req Body
            const { email, otp, signIn = false, updateEmail = false, oldEmail, remember = false } = req.body;
            // Logger.info(`${fileName + fn} req.body: ${JSON.stringify(req.body)}`);

            // Search on encrypted email field
            const messageToSearchWith: any = new User({ email });
            messageToSearchWith.encryptFieldsSync();

            let userData: any = await User.findOne({ "$or": [{ email: messageToSearchWith.email }, { communication_email: messageToSearchWith.email }] });

            if (!userData) {
                if (!updateEmail) throw new Error(constructResponseMsg(this.locale, "user-nf"));
            }

            if (updateEmail) {
                userData = await User.findOne({ "$or": [{ email: messageToSearchWith.email }, { communication_email: messageToSearchWith.email }] });
            }
            delete userData._doc.__enc_email;
            delete userData._doc.__enc_communication_email;
            delete userData._doc.__enc_mobile_number;
            delete userData._doc.__enc_city;
            userData = userData._doc;

            const verifyOtp = await this.verifyOtp(userData.id || 0, otp);

            if (!verifyOtp) {
                throw new Error(constructResponseMsg(this.locale, "in-otp"));
            }

            // Added for 2FA at signin
            if (signIn) {
                const formattedUserData = await this.fetchUserDetails(userData.id || 0);
                const session = await this.createSession(userData._id || 0, userData.id || 0, email, req, userData.account_status || 0, remember);

                if (session) {
                    formattedUserData.token = session.token;
                }

                return serverResponse(res, HttpCodeEnum.OK, constructResponseMsg(this.locale, "us-lon"), formattedUserData);
            }

            if (!userData.is_email_verified) {
                await User.findOneAndUpdate({ id: userData.id }, { is_email_verified: true });
            }
            if (updateEmail) {
                await User.findOneAndUpdate({ id: userData.id }, { communication_email: messageToSearchWith.email });
            }

            const userUpdatedData = await this.fetchUserDetails(userData.id || 0);

            return serverResponse(res, HttpCodeEnum.OK, constructResponseMsg(this.locale, "us-lon"), userUpdatedData);
        } catch (err: any) {
            return serverErrorHandler(err, res, err.message, HttpCodeEnum.SERVERERROR, {});
        }
    }

    // Checked with encryption
    public async resetPassword(req: Request, res: Response): Promise<any> {
        try {
            const fn = "[resePassword]";
            // Set locale
            const { locale } = req.query;
            this.locale = (locale as string) || "en";

            // Req Body
            const { password, email } = req.body;
            // Logger.info(`${fileName + fn} req.body: ${JSON.stringify(req.body)}`);

            // Search on encrypted email field
            const emailToSearchWith: any = new User({ email });
            emailToSearchWith.encryptFieldsSync();

            let userData: any = await User.findOne({ "$or": [{ email: emailToSearchWith.email }, { communication_email: emailToSearchWith.email }] });

            if (!userData) {
                throw new Error(constructResponseMsg(this.locale, "user-nf"));
            }

            delete userData._doc.__enc_email;
            delete userData._doc.__enc_communication_email;
            delete userData._doc.__enc_mobile_number;
            delete userData._doc.__enc_city;
            userData = userData._doc;

            const dePassword = decryptText(password);

            if (!dePassword) {
                throw new Error(constructResponseMsg(this.locale, "invalid-password"));
            }
            const verifyPassword: Boolean = await Bcrypt.compare(dePassword, userData.password);

            if (verifyPassword) {
                throw new Error(constructResponseMsg(this.locale, "same-password"));
            }
            const hashedPassword: string = Bcrypt.hashSync(dePassword, 10);
            await User.findOneAndUpdate({ id: userData.id }, { password: hashedPassword });

            return serverResponse(res, HttpCodeEnum.OK, constructResponseMsg(this.locale, "password-reset"), {});
        } catch (err: any) {
            return serverErrorHandler(err, res, err.message, HttpCodeEnum.SERVERERROR, {});
        }
    }


    // Checked
    public async getUserDetailsByid(req: Request, res: Response): Promise<any> {
        try {
            const fn = "[getUserDetailsByid]";
            const { userid } = req.params;

            // Set locale
            const { locale } = req.query;
            this.locale = (locale as string) || "en";
            Logger.info(`${fileName + fn} user_id: ${userid}`);

            const userData: any = await this.fetchUserDetails(parseInt(userid));
            userData.email = userData.email.split("@")[1] !== "socialemailnotfound.com" ? userData.email : null;
            // Logger.info(`${fileName + fn} Response: ${JSON.stringify(userData)}`);

            return serverResponse(res, HttpCodeEnum.OK, constructResponseMsg(this.locale, "user-ds"), userData);
        } catch (err: any) {
            return serverErrorHandler(err, res, err.message, HttpCodeEnum.SERVERERROR, {});
        }
    }


    // UnChecked
    public async refreshUserToken(req: Request, res: Response): Promise<any> {
        try {
            const fn = "[refreshToken]";
            const { user_id, object_id } = req.customer;
            const { locale } = req.query;
            this.locale = (locale as string) || "en";
            const authId: any = req.headers.authorization?.split(" ");
            Logger.info(`${fileName + fn} user_id: ${user_id}`);

            const currentToken: any = await Sessions.findOne({ user_id: user_id, token: authId[1] }, { id: true }).lean();
            const formattedUserData: any = await this.fetchUserDetails(user_id);
            const session: any = await this.createSession(object_id, formattedUserData.id, formattedUserData.communication_email, req, formattedUserData.account_status, true);
            await Sessions.deleteOne({ id: currentToken.id });

            return serverResponse(res, HttpCodeEnum.OK, constructResponseMsg(this.locale, "token-ref"), { "token": session.token });
        } catch (err: any) {
            return serverErrorHandler(err, res, err.message, HttpCodeEnum.SERVERERROR, {});
        }
    }

    // Checked with encryption
    public async updateCoordinates(req: Request, res: Response): Promise<any> {
        try {
            const fn = "[updateCoordinates]";
            // Set locale
            const { locale } = req.query;
            this.locale = (locale as string) || "en";

            // Req Body
            const { latitude, longitude } = req.body;
            // Logger.info(`${fileName + fn} req.body: ${JSON.stringify(req.body)}`);


            await Customer.findOneAndUpdate({ id: req.customer.user_id }, { latitude: latitude, longitude: longitude });

            return serverResponse(res, HttpCodeEnum.OK, constructResponseMsg(this.locale, "location-update"), {});
        } catch (err: any) {
            return serverErrorHandler(err, res, err.message, HttpCodeEnum.SERVERERROR, {});
        }
    }

    // Checked with encryption
    public async addUpdateDevice(req: Request, res: Response): Promise<any> {
        try {
            const fn = "[addUpdateDevice]";
            // Set locale
            const { locale } = req.query;
            this.locale = (locale as string) || "en";

            // Req Body
            const { device_id, type } = req.body;
            // Logger.info(`${fileName + fn} req.body: ${JSON.stringify(req.body)}`);

            const device: any = await Deviceid.findOne({ device_id: device_id }).lean();
            console.log(device);
            if (!device) {
                await Deviceid.create({ device_id: device_id, type: type, created_by: req.customer.object_id });
            }


            return serverResponse(res, HttpCodeEnum.OK, constructResponseMsg(this.locale, "deviceid-add"), {});
        } catch (err: any) {
            return serverErrorHandler(err, res, err.message, HttpCodeEnum.SERVERERROR, {});
        }
    }
}