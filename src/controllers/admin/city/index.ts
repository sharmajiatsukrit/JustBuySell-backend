import { Request, Response } from "express";
import { ValidationChain } from "express-validator";
import validator from "validator";
import Bcrypt from "bcryptjs";
import { DateTime } from "luxon";
import moment from "moment";
import { Roles, Permissons, User } from "../../../models";
import { removeObjectKeys, serverResponse, serverErrorHandler, removeSpace, constructResponseMsg, serverInvalidRequest, groupByDate } from "../../../utils";
import { HttpCodeEnum } from "../../../enums/server";
import validate from "./validate";
import EmailService from "../../../utils/email";
import { getPostsForAdmin, getPostsForAdminBySubscriberId, getChatCount, getPostCount, postDelete } from "../../../services/Chat";
import Logger from "../../../utils/logger";
import ServerMessages, { ServerMessagesEnum } from "../../../config/messages";

const fileName = "[admin][users][index.ts]";
export default class CityController {
    public locale: string = "en";
    public emailService;

    constructor() {
        this.emailService = new EmailService();
    }

    public validate(endPoint: string): ValidationChain[] {
        return validate(endPoint);
    }


    // Checked
    public async getList(req: Request, res: Response): Promise<any> {
        try {
            const fn ="[getList]";
            // Set locale
            const { locale } = req.query;
            this.locale = (locale as string) || "en";
            
                            
            const result = await User.find({}).sort([['id', 'desc']]).lean();

            if (result) {
                return serverResponse(res, HttpCodeEnum.OK, ServerMessages.errorMsgLocale(this.locale, ServerMessagesEnum["user-fetched"]), result);
            } else {
                throw new Error(ServerMessages.errorMsgLocale(this.locale, ServerMessagesEnum["not-found"]));
            }
        } catch (err: any) {
            return serverErrorHandler(err, res, err.message, HttpCodeEnum.SERVERERROR, {});
        }
    }

    // Checked
    public async getDetailsById(req: Request, res: Response): Promise<any> {
        try {
            const fn ="[getDetailsById]";
            // Set locale
            const { locale } = req.query;
            this.locale = (locale as string) || "en";

            const id = parseInt(req.params.id);
            const result = await User.find({ id: id }).lean();
            console.log(result);
            // const result = await getPostsForAdminBySubscriberId(id, req.headers.authorization);

            if (result.length > 0) {
                return serverResponse(res, HttpCodeEnum.OK, ServerMessages.errorMsgLocale(this.locale, ServerMessagesEnum["user-fetched"]), result);
            } else {
                throw new Error(ServerMessages.errorMsgLocale(this.locale, ServerMessagesEnum["not-found"]));
            }
        } catch (err: any) {
            return serverErrorHandler(err, res, err.message, HttpCodeEnum.SERVERERROR, {});
        }
    }

    public async add(req: Request, res: Response): Promise<any> {
        try {
            const fn = "[add]";
            // Set locale
            const { locale } = req.query;
            this.locale = (locale as string) || "en";

            const { first_name, last_name, email, password, device = "", ip_address = "" } = req.body;
            // Logger.info(`${fileName + fn} req.body: ${JSON.stringify(req.body)}`);

            const isUserExists = await this.getExistingUser(email);

            if (isUserExists.is_email_verified) {
                throw new Error(constructResponseMsg(this.locale, "email-ar"));
            }

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

            if(!isUserExists.email) {
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
            

            return serverResponse(res, HttpCodeEnum.OK, constructResponseMsg(this.locale, "user-add"), formattedUserData);
        } catch (err: any) {
            return serverErrorHandler(err, res, err.message, HttpCodeEnum.SERVERERROR, {});
        }
    }

    public async fetchUserDetails(userId: number, billing = "") {
        try {
            const userData: any = await User.findOne({ id: userId }, {password: false, account_status: false, subscribed_to: false});

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
    public async update(req: Request, res: Response): Promise<any> {
        try {
            const fn = "[update]";

            const { user_id } = req.user;
            Logger.info(`${fileName + fn} user_id: ${user_id}`);

            // Set locale
            const { locale } = req.query;
            this.locale = (locale as string) || "en";
            const { first_name, last_name, email, password } = req.body;
            
            await User.findOneAndUpdate({ id: user_id }, {first_name:first_name,last_name:last_name,email:email});

            const userData: any = await this.fetchUserDetails(user_id);

            return serverResponse(res, HttpCodeEnum.OK, constructResponseMsg(this.locale, "user-update"), userData);
        } catch (err: any) {
            return serverErrorHandler(err, res, err.message, HttpCodeEnum.SERVERERROR, {});
        }
    }

    // Checked
    public async delete(req: Request, res: Response): Promise<any> {
        try {
            const fn ="[delete]";
            // Set locale
            const { locale } = req.query;
            this.locale = (locale as string) || "en";

            const id = parseInt(req.params.id);
            const result = await User.deleteOne({ id: id });

            if (result) {
                return serverResponse(res, HttpCodeEnum.OK, ServerMessages.errorMsgLocale(this.locale, ServerMessagesEnum["user-delete"]), result);
            } else {
                throw new Error(ServerMessages.errorMsgLocale(this.locale, ServerMessagesEnum["not-found"]));
            }
        } catch (err: any) {
            return serverErrorHandler(err, res, err.message, HttpCodeEnum.SERVERERROR, {});
        }
    }

    // Checked
    public async status(req: Request, res: Response): Promise<any> {
        try {
            const fn ="[status]";
            // Set locale
            const { locale } = req.query;
            this.locale = (locale as string) || "en";

            const id = parseInt(req.params.id);
            const result = await User.findOneAndUpdate({ id: id }, {status:1}).lean();

            if (result) {
                return serverResponse(res, HttpCodeEnum.OK, ServerMessages.errorMsgLocale(this.locale, ServerMessagesEnum["user-status"]), result);
            } else {
                throw new Error(ServerMessages.errorMsgLocale(this.locale, ServerMessagesEnum["not-found"]));
            }
        } catch (err: any) {
            return serverErrorHandler(err, res, err.message, HttpCodeEnum.SERVERERROR, {});
        }
    }

}