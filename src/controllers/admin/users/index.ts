import { Request, Response } from "express";
import { ValidationChain } from "express-validator";
import validator from "validator";
import Bcrypt from "bcryptjs";
import { DateTime } from "luxon";
import moment from "moment";
import { Roles, Permissions, User } from "../../../models";
import { removeObjectKeys, serverResponse, serverErrorHandler, removeSpace, constructResponseMsg, serverInvalidRequest, groupByDate } from "../../../utils";
import { HttpCodeEnum } from "../../../enums/server";
import validate from "./validate";
import EmailService from "../../../utils/email";
import { getPostsForAdmin, getPostsForAdminBySubscriberId, getChatCount, getPostCount, postDelete } from "../../../services/Chat";
import Logger from "../../../utils/logger";
import ServerMessages, { ServerMessagesEnum } from "../../../config/messages";

const fileName = "[admin][users][index.ts]";
export default class UserController {
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
            const fn = "[getList]";
            // Set locale
            const { locale } = req.query;
            this.locale = (locale as string) || "en";


            // const result = await User.find({}).sort([['id', 'desc']]).lean();
            const result = await User.aggregate([
                {
                    $match: { type: 0 }
                },
                {
                    $lookup: 
                    {
                        from: "cities",
                        localField: "city",
                        foreignField: "id",
                        as: "cities",
                    },
                },
                {
                    $lookup: 
                    {
                        from: "states",
                        localField: "state",
                        foreignField: "id",
                        as: "states",
                    },
                },
                {
                    $lookup: 
                    {
                        from: "countries",
                        localField: "country",
                        foreignField: "id",
                        as: "countries",
                    },
                },
                {
                    $lookup: 
                    {
                        from: "roles",
                        localField: "role_id",
                        foreignField: "id",
                        as: "roles",
                    },
                },
                {
                    $sort: { id: -1 }
                }
            ]).exec();

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
            const fn = "[getDetailsById]";
            // Set locale
            const { locale } = req.query;
            this.locale = (locale as string) || "en";

            const id = parseInt(req.params.id);
            const result = await User.aggregate([
                {
                    $match: { id: id, type: 0 }
                },
                {
                    $lookup: {
                        from: "cities",
                        localField: "city",
                        foreignField: "id",
                        as: "cities",
                    },
                },
                {
                    $lookup: {
                        from: "states",
                        localField: "state",
                        foreignField: "id",
                        as: "states",
                    },
                },
                {
                    $lookup: {
                        from: "countries",
                        localField: "country",
                        foreignField: "id",
                        as: "countries",
                    },
                },
                {
                    $lookup: {
                        from: "roles",
                        localField: "role_id",
                        foreignField: "id",
                        as: "roles",
                    },
                },
            ]).exec();

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
    
            const { name, phone, email, address, city_id, state_id, country_id, role_id, password } = req.body;
    
            // Validate password length
            if (password.length < 8) {
                return serverResponse(res, HttpCodeEnum.BADREQUEST, constructResponseMsg(this.locale, "password-length"), {});
            }
    
            const enpassword = await Bcrypt.hash(password, 10);
    
            const userData = await User.create({
                name,
                mobile_number: phone,
                email,
                address,
                city: city_id,
                state: state_id,
                country: country_id,
                role_id,
                password: enpassword,
                type: 0,
                status: 1,
            });
    
            const formattedUserData = await this.fetchUserDetails(userData.id);
    
            return serverResponse(res, HttpCodeEnum.OK, constructResponseMsg(this.locale, "user-add"), formattedUserData);
        } catch (err: any) {
            return serverErrorHandler(err, res, err.message, HttpCodeEnum.SERVERERROR, {});
        }
    }  

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

            const user_id = parseInt(req.params.id);
            Logger.info(`${fileName + fn} user_id: ${user_id}`);

            // Set locale
            const { locale } = req.query;
            this.locale = (locale as string) || "en";
            const { name, phone, email, address, city_id, state_id, country_id, role_id, password } = req.body;

            await User.findOneAndUpdate({ id: user_id }, { name, phone, email, address, city_id, state_id, country_id, role_id, password });

            const userData: any = await this.fetchUserDetails(user_id);

            return serverResponse(res, HttpCodeEnum.OK, constructResponseMsg(this.locale, "user-update"), userData);
        } catch (err: any) {
            return serverErrorHandler(err, res, err.message, HttpCodeEnum.SERVERERROR, {});
        }
    }

    // Checked
    public async delete(req: Request, res: Response): Promise<any> {
        try {
            const fn = "[delete]";
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
            const fn = "[status]";
            // Set locale
            const { locale } = req.query;
            this.locale = (locale as string) || "en";

            const id = parseInt(req.params.id);
            const { status } = req.body;
            const updationstatus = await User.findOneAndUpdate({ id: id }, { status: status }).lean();
            const result: any = await this.fetchUserDetails(id);
            if (updationstatus) {
                return serverResponse(res, HttpCodeEnum.OK, ServerMessages.errorMsgLocale(this.locale, ServerMessagesEnum["user-status"]), result);
            } else {
                throw new Error(ServerMessages.errorMsgLocale(this.locale, ServerMessagesEnum["not-found"]));
            }
        } catch (err: any) {
            return serverErrorHandler(err, res, err.message, HttpCodeEnum.SERVERERROR, {});
        }
    }

    public async changePass(req: Request, res: Response): Promise<any> {
        try {
            const fn = "[changepass]";
            // Set locale
            const { locale } = req.query;
            this.locale = (locale as string) || "en";
    
            const { id } = req.params;
            const { currentpass, newpass, confirmpass } = req.body;
    
            // Fetch the user by id
            const user = await User.findOne({ id: id }).lean();
    
            if (!user) {
                throw new Error(ServerMessages.errorMsgLocale(this.locale, ServerMessagesEnum["not-found"]));
            }
    
            // Check if the current password matches the user's password
            const isMatch = await Bcrypt.compare(currentpass, user.password);
            if (!isMatch) {
                return serverResponse(res, HttpCodeEnum.UNAUTHORIZED, ServerMessages.errorMsgLocale(this.locale, ServerMessagesEnum["incorrect-password"]), {});
            }
    
            // Check if new password and confirm password match
            if (newpass !== confirmpass) {
                return serverResponse(res, HttpCodeEnum.BADREQUEST, ServerMessages.errorMsgLocale(this.locale, ServerMessagesEnum["password-mismatch"]), {});
            }
    
            // Hash the new password
            const saltRounds = 10;
            const hashedPassword = await Bcrypt.hash(newpass, saltRounds);
    
            // Update the user's password
            const updationstatus = await User.findOneAndUpdate({ id: id }, { password: hashedPassword }).lean();
    
            if (updationstatus) {
                return serverResponse(res, HttpCodeEnum.OK, ServerMessages.errorMsgLocale(this.locale, ServerMessagesEnum["password-updated"]), {});
            } else {
                throw new Error(ServerMessages.errorMsgLocale(this.locale, ServerMessagesEnum["update-failed"]));
            }
        } catch (err: any) {
            return serverErrorHandler(err, res, err.message, HttpCodeEnum.SERVERERROR, {});
        }
    }

    public async updateProfileImg(req: Request, res: Response): Promise<any> {
        try {
            const fn = "[updateProfileImg]";
            // Set locale
            const { locale } = req.query;
            this.locale = (locale as string) || "en";
    
            const { id } = req.params;

            let product_image: string | undefined;
            if (req.files && typeof req.files === 'object') {

                if ('product_image' in req.files) {
                    const files = req.files as { [fieldname: string]: Express.Multer.File[] };
                    product_image = files['product_image'][0].path;
                }
            }
    
            // Fetch the user by id
            const user = await User.findOne({ id: id }).lean();
    
            if (!user) {
                throw new Error(ServerMessages.errorMsgLocale(this.locale, ServerMessagesEnum["not-found"]));
            }
    
            // Update the user's profile image
            const updationstatus = await User.findOneAndUpdate({ id: id }, { profile_img_url: product_image }).lean();
    
            if (updationstatus) {
                return serverResponse(res, HttpCodeEnum.OK, ServerMessages.errorMsgLocale(this.locale, ServerMessagesEnum["profile-img-updated"]), {});
            } else {
                throw new Error(ServerMessages.errorMsgLocale(this.locale, ServerMessagesEnum["update-failed"]));
            }
        } catch (err: any) {
            return serverErrorHandler(err, res, err.message, HttpCodeEnum.SERVERERROR, {});
        }
    }
    

}