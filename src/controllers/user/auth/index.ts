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

    // Checked with encryption
    private async generateOtp(userId: number): Promise<number> {
        const minNo = 100000;
        const maxNo = 999999;
        const otp = 123456;//Math.floor(Math.random() * (maxNo - minNo + 1)) + minNo;
        const hashedOtp = await Bcrypt.hash(otp.toString(), 10);

        const isOTPExist = await Otps.where({ user_id: userId }).countDocuments();

        const otpValidDate = moment().add(10, 'minutes');

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
    private async createSession(user_id: number, email: string, req: Request, status: number, remember: boolean) {
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

    // Checked with encryption
    public async fetchUserDetailsLite(userId: number): Promise<any> {
        try {
            const userData: any = await User.findOne({ id: userId });
            delete userData._doc.__enc_email;
            delete userData._doc.__enc_communication_email;
            delete userData._doc.__enc_mobile_number;
            delete userData._doc.__enc_city;

            if (!userData) {
                throw new Error(constructResponseMsg(this.locale, "user-nf"));
            }

            const formattedUserData = removeObjectKeys(userData._doc, [
                "username",
                "password",
                "mobile_number_country_code",
                "mobile_number",
                "is_mobile_number_verified",
                "date_of_birth",
                "city",
                "country",
                "country_code",
                "address",
                "job_title",
                "account_status",
                "social_handles",
                "tax_id",
                "view_mobile_journey",
                "subscribed_to",
                "device",
                "ip_address",
                "notify_on_email",
                "notify_on_mobile",
                "is_email_verified",
                "is_profile_journey_completed",
                "is_first_group_created",
                "is_first_invite_sent",
                "is_mobile_journey_completed",
                "is_welcome_journey_completed",
                "is_ai_journey_completed",
                "referred_by",
                "superadmin",
                "createdAt",
                "updatedAt"
            ]);
            const activeSubscriberData: any = {};
            formattedUserData.active_subscriber = removeObjectKeys(activeSubscriberData, ["pubnub_channels"]);

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

    // Checked with encryption
    public async register(req: Request, res: Response): Promise<any> {
        try {
            const fn = "[register]";
            // Set locale
            const { locale } = req.query;
            this.locale = (locale as string) || "en";
    
            const { first_name, last_name, email, password, device = "", ip_address = "" } = req.body;
            // Logger.info(`${fileName + fn} req.body: ${JSON.stringify(req.body)}`);
    
            const isUserExists = await this.getExistingUser(email);
    
            // Validate email
            const isValidEmail = validator.isEmail(email);
    
            if (!isValidEmail) {
                throw new Error(constructResponseMsg(this.locale, "email-iv"));
            }
    
            // Check if the user already exists and the email is verified
            if (isUserExists && isUserExists.is_email_verified) {
                return serverResponse(res, HttpCodeEnum.BADREQUEST, constructResponseMsg(this.locale, "email-ar"), {});
            }
    
            // Check if the user already exists but the email is not verified
            if (isUserExists && !isUserExists.is_email_verified) {
                return serverResponse(res, HttpCodeEnum.BADREQUEST, constructResponseMsg(this.locale, "email-iv"), {});
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
                    first_name,
                    last_name,
                    email,
                    communication_email: email,
                    device,
                    password: hashedPassword,
                    ip_address,
                    status: 1
                });
            } else {
                userData = {
                    id: isUserExists.id,
                    email: isUserExists.email,
                    status: true,
                    superadmin: (isUserExists.superadmin) ? true : false
                };
            }
    
            const formattedUserData = await this.fetchUserDetails(userData.id);
    
            return serverResponse(res, HttpCodeEnum.OK, constructResponseMsg(this.locale, "user-os"), formattedUserData);
        } catch (err: any) {
            return serverErrorHandler(err, res, err.message, HttpCodeEnum.SERVERERROR, {});
        }
    }    



    // signin with password
    public async signIn(req: Request, res: Response): Promise<any> {
        try {
            const fn = "[signIn]";
            // Set locale
            const { locale } = req.query;
            this.locale = (locale as string) || "en";

            let { email, password } = req.body;
            const emailToSearchWith: any = new User({ email: removeSpace(email) });
            emailToSearchWith.encryptFieldsSync();

            const isUserExists = await this.checkIfUserExists(email);
            if (!isUserExists) {
                throw new Error(constructResponseMsg(this.locale, "email-already-exists"));
            }

            const userData: any = await User.findOne({ is_email_verified: true, $or: [{ email: emailToSearchWith.email }, { communication_email: email }] });
            if (!userData) {
                throw new Error(constructResponseMsg(this.locale, "user-nf"));
            }
            const dePassword = decryptText(password);

            if (!dePassword) {
                throw new Error(constructResponseMsg(this.locale, "invalid-password"));
            }

            const verifyPassword: Boolean = await Bcrypt.compare(dePassword, userData._doc.password);

            if (!verifyPassword) {
                throw new Error(constructResponseMsg(this.locale, "invalid-password"));
            }

            const otp = await this.generateOtp(userData._doc.id);


            return serverResponse(res, HttpCodeEnum.OK, constructResponseMsg(this.locale, "user-si"), {});
        } catch (err: any) {
            return serverErrorHandler(err, res, err.message, HttpCodeEnum.SERVERERROR, {});
        }
    }

    // login
    public async login(req: Request, res: Response): Promise<any> {
        try {
            const fn = "[login]";
            const { locale } = req.query;
            this.locale = (locale as string) || "en";
    
            const { mobile_number } = req.body;
    
            console.log(mobile_number);
    
            if (!mobile_number) {
                throw new Error(constructResponseMsg(this.locale, "phone-number-required"));
            }
    
            let userData = await User.findOne({ mobile_number });
    
            if (!userData) {
                // User does not exist, register the user
                const newUser = await User.create({ mobile_number: mobile_number });
                console.log("newuser", newUser);
                userData = newUser;
            }
    
            // Generate OTP for the user
            const otp = await this.generateOtp(userData.id);
    
            return serverResponse(res, HttpCodeEnum.OK, constructResponseMsg(this.locale, "otp-sent"), {});
    
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

    // public async editProfile(req: Request, res: Response): Promise<any> {
    //     try {
    //         const fn = "[editProfile]";

    //         const { user_id } = req.user;
    //         Logger.info(`${fileName + fn} user_id: ${user_id}`);

    //         // Set locale
    //         const { locale } = req.query;
    //         this.locale = (locale as string) || "en";

    //         const formattedUserData: any = await this.fetchUserDetails(user_id);

    //         const updateData: any = {};
    //         const updateKey = [
    //             "first_name",
    //             "last_name",
    //             "communication_email",
    //             "mobile_number_country_code",
    //             "mobile_number",
    //             "date_of_birth",
    //             "country_code",
    //             "country",
    //             "language_code",
    //             "language",
    //             "city",
    //             "tax_id",
    //             "address"

    //         ];
    //         const encryptedKey = [
    //             "communication_email",
    //             "mobile_number",
    //             "city"
    //         ];

    //         if (req.body.time_format) {
    //             const validTimeFormat = ["12", "24"];
    //             if (!validTimeFormat.includes(req.body.time_format)) return serverInvalidRequest(req, res, "Required fields are missing or invalid in req body time format");
    //         }

    //         if (req.body.date_format) {
    //             const validTimeFormat = ["DD-MM-YY", "MM-DD-YY", "YY-MM-DD"];
    //             if (!validTimeFormat.includes(req.body.date_format)) return serverInvalidRequest(req, res, "Required fields are missing or invalid in req body date format");
    //         }

    //         await updateKey.reduce(async (a, key) => {
    //             // Wait for the previous item to finish processing
    //             await a;
    //             // Process this item
    //             if (req.body[key] !== undefined) {
    //                 if (encryptedKey.includes(key)) {
    //                     updateData[key] = await getUserEncryptedData(key, req.body[key]);
    //                 } else {
    //                     updateData[key] = req.body[key];
    //                 }
    //             }
    //         }, Promise.resolve());

    //         if (req.body["trial_started_on"] === 1) {
    //             const activeSubscriberId = formattedUserData.activeSubscriber.id || 0;
    //             Subscriber.findOneAndUpdate(activeSubscriberId, { trial_started_on: Date.now() });
    //         }

    //         await User.findOneAndUpdate({ id: user_id }, updateData);

    //         if (req.body["first_name"] || req.body["last_name"] ) {
    //             await Subscriber.findOneAndUpdate({ account_owner: user_id, subscriber_priority: 1 }, { subscriber_firm_name: `${req.body["first_name"]} ${req.body["last_name"]}` });
    //         }

    //         const userData: any = await this.fetchUserDetails(user_id);

    //         return serverResponse(res, HttpCodeEnum.OK, constructResponseMsg(this.locale, "user-es"), userData);
    //     } catch (err: any) {
    //         return serverErrorHandler(err, res, err.message, HttpCodeEnum.SERVERERROR, {});
    //     }
    // }

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


    public async verifyOtplogin(req: Request, res: Response): Promise<any> {
        try {
            const fn ="[verifyOtpForForgetPassword]";
            // Set locale
            const { locale } = req.query;
            this.locale = (locale as string) || "en";
    
            // Req Body
            const { mobile_number, otp } = req.body;
    
            // Search on encrypted email field
            // const messageToSearchWith: any = new User({ mobile_number });
    
            const userData: any = await User.findOne({ mobile_number });
    
            if (!userData) {
                throw new Error(constructResponseMsg(this.locale, "user-nf"));
            }
    
            const verifyOtp = await this.verifyOtp(userData.id || 0, otp);
    
            if (!verifyOtp) {
                throw new Error(constructResponseMsg(this.locale, "in-otp"));
            }
    
            // OTP is verified successfully
            // Add your logic to allow password reset or send reset token to user
            // const resetToken = await this.createPasswordResetToken(userData.id || 0);
    
            return serverResponse(res, HttpCodeEnum.OK, constructResponseMsg(this.locale, "otp-verified"), {verifyOtp});
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
                const session = await this.createSession(userData.id || 0, email, req, userData.account_status || 0, remember);

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
    public async resetOldPassword(req: Request, res: Response): Promise<any> {
        try {
            const fn = "[resetOldPassword]";
            // Set locale
            const { locale } = req.query;
            const { user_id } = req.user;
            this.locale = (locale as string) || "en";

            // Req Body
            const { password, oldPassword } = req.body;
            // Logger.info(`${fileName + fn} req.body: ${JSON.stringify(req.body)}`);

            const userData: any = await User.findOne({ id: user_id }).lean();
            if (!userData) {
                throw new Error();
            }

            const deOldPassword = decryptText(oldPassword);
            if (!deOldPassword) {
                throw new Error(constructResponseMsg(this.locale, "invalid-password"));
            }

            const verifyOldPassword: Boolean = await Bcrypt.compare(deOldPassword, userData.password);
            if (!verifyOldPassword) {
                throw new Error(constructResponseMsg(this.locale, "invalid-password"));
            }

            const dePassword = decryptText(password);
            if (!dePassword) {
                throw new Error(constructResponseMsg(this.locale, "invalid-password"));
            }

            const verifyPassword: Boolean = await Bcrypt.compare(dePassword, userData.password);
            if (verifyPassword) {
                throw new Error(constructResponseMsg(this.locale, "same-password"));
            }

            const hashedPassword: string = await Bcrypt.hashSync(dePassword, 10);
            await User.findOneAndUpdate({ id: user_id }, { password: hashedPassword });

            return serverResponse(res, HttpCodeEnum.OK, constructResponseMsg(this.locale, "password-reset"), {});
        } catch (err: any) {
            return serverErrorHandler(err, res, err.message, HttpCodeEnum.SERVERERROR, {});
        }
    }

    // UnChecked
    // public async tempDeleteUser(req: Request, res: Response): Promise<any> {
    //     try {
    //         const fn = "[tempDeleteUser]";
    //         const authId = req.headers.authorization;
    //         const { deleteReason } = req.body;
    //         const { user_id } = req.user;
    //         const userData = await this.fetchUserDetails(user_id);

    //         const userPermissions = await Permissons.findOne({user_id: user_id, subscriber_id: userData.activeSubscriber.id }).lean();

    //         if(userPermissions?.permisson !== UserPermssionType.Admin) {
    //             throw new Error(ServerMessages.errorMsgLocale(this.locale, ServerMessagesEnum["permission-denied"]));
    //         }

    //         // Logger.info(`${fileName + fn} req.body: ${JSON.stringify(req.body)}`);
    //         await Subscriber.findOneAndUpdate({ id: userData.activeSubscriber.id }, { is_deleted: true, deleteReason: deleteReason });
    //         await postSoftDelete(userData.activeSubscriber.id, authId);

    //         return serverResponse(res, HttpCodeEnum.OK, constructResponseMsg(this.locale, "user-dl"), {});
    //     } catch (err: any) {
    //         res.send(err.message || "User delete failed");
    //     }
    // }

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

    // Checked
    public async getUserLiteDetailsByid(req: Request, res: Response): Promise<any> {
        try {
            const fn = "[getUserLiteDetailsByid]";
            const { userid } = req.params;

            // Set locale
            const { locale } = req.query;
            this.locale = (locale as string) || "en";
            Logger.info(`${fileName + fn} user_id: ${userid}`);

            const userData: any = await this.fetchUserDetailsLite(parseInt(userid));
            userData.email = userData.email.split("@")[1] !== "socialemailnotfound.com" ? userData.email : null;

            return serverResponse(res, HttpCodeEnum.OK, constructResponseMsg(this.locale, "user-ds"), userData);
        } catch (err: any) {
            return serverErrorHandler(err, res, err.message, HttpCodeEnum.SERVERERROR, {});
        }
    }

    // UnChecked
    public async uploadUserImage(req: Request, res: Response): Promise<any> {
        try {
            // Set locale
            const { locale } = req.query;
            this.locale = (locale as string) || "en";

            const { user_id } = req.user;
            const { is_cover_image = false } = JSON.parse(req.body?.data);
            const { file = null } = req;

            if (!file) {
                throw new Error(ServerMessages.errorMsgLocale(this.locale, ServerMessagesEnum["no-file-provided"]));
            }

            const editData: any = {};
            const fileName = "u-" + user_id + "/" + file?.originalname

            if (is_cover_image) {
                editData.cover_img_url = await uploadFile(fileName, file?.buffer);
            } else {
                editData.profile_img_url = await uploadFile(fileName, file?.buffer);
            }

            const userData: any = await User.findOneAndUpdate({ id: user_id }, editData);
            // await Subscriber.findOneAndUpdate({account_owner: user_id, subscriber_priority: SubscriberType.Individual }, editData);
            // if (is_cover_image) {
            //     if(userData.cover_img_url) {
            //         await deleteFile(userData.cover_img_url);
            //     }
            // } else {
            //     if(userData.profile_img_url) {
            //         await deleteFile(userData.profile_img_url);
            //     }
            // }

            const returnUserData = await this.fetchUserDetails(user_id);

            return serverResponse(res, HttpCodeEnum.OK, constructResponseMsg(this.locale, "user-upload-image-successfully"), returnUserData);
        } catch (err: any) {
            return serverErrorHandler(err, res, err.message, HttpCodeEnum.SERVERERROR, {});
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
            const session: any = await this.createSession(formattedUserData.id, formattedUserData.communication_email, req, formattedUserData.account_status, true);
            await Sessions.deleteOne({ id: currentToken.id });

            return serverResponse(res, HttpCodeEnum.OK, constructResponseMsg(this.locale, "token-ref"), { "token": session.token });
        } catch (err: any) {
            return serverErrorHandler(err, res, err.message, HttpCodeEnum.SERVERERROR, {});
        }
    }


    // Checked with encryption
    // public async adminSignIn(req: Request, res: Response): Promise<any> {
    //     const fn = "[adminSignIn]";

    //     try {
    //         // Set locale
    //         const { locale } = req.query;
    //         this.locale = (locale as string) || "en";

    //         let { email, password, remember = false } = req.body;


    //         // Remove spaces from email
    //         email = removeSpace(email);
    //         const emailToSearchWith: any = new User({ email });
    //         emailToSearchWith.encryptFieldsSync();
    //         console.log(`${fn} Encrypted email: ${emailToSearchWith.email}`);

    //         // Check if user exists
    //         const isUserExists = await this.checkIfUserExists(email);
    //         if (!isUserExists) {
    //             throw new Error(constructResponseMsg(this.locale, "email-not-found"));
    //         }

    //         // Find user data
    //         const userData: any = await User.findOne({
    //             is_email_verified: true,
    //             $or: [{ email: emailToSearchWith.email }, { communication_email: email }]
    //         });
    //         if (!userData) {
    //             throw new Error(constructResponseMsg(this.locale, "user-not-found"));
    //         }

    //         // Verify password
    //         const verifyPassword: Boolean = await Bcrypt.compare(password, userData._doc.password);
    //         if (!verifyPassword) {
    //             throw new Error(constructResponseMsg(this.locale, "invalid-password"));
    //         }

    //         // Fetch user details
    //         const formattedUserData = await this.fetchUserDetails(userData.id || 0);

    //         // Create session
    //         const session = await this.createSession(userData.id || 0, email, req, userData.account_status || 0, remember);
    //         if (session) {
    //             formattedUserData.token = session.token;
    //         }

    //         // Return successful response
    //         return serverResponse(res, HttpCodeEnum.OK, constructResponseMsg(this.locale, "logged-in"), formattedUserData);
    //     } catch (err: any) {
    //         console.error(`${fn} Error: ${err.message}`);
    //         return serverErrorHandler(err, res, err.message, HttpCodeEnum.SERVERERROR, {});
    //     }
    // }


    public async adminSignIn(req: Request, res: Response): Promise<any> {
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
            const session = await this.createSession(user.id, email, req, user.status, remember);
    
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


}