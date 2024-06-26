import { Request, Response } from "express";
import { ValidationChain } from "express-validator";
import validator from "validator";
import Bcrypt from "bcryptjs";
import { DateTime } from "luxon";
import moment from "moment";
import { Roles, Permissions, User, Customer } from "../../../models";
import { removeObjectKeys, serverResponse, serverErrorHandler, removeSpace, constructResponseMsg, serverInvalidRequest, groupByDate } from "../../../utils";
import { HttpCodeEnum } from "../../../enums/server";
import validate from "./validate";
import EmailService from "../../../utils/email";
import { getPostsForAdmin, getPostsForAdminBySubscriberId, getChatCount, getPostCount, postDelete } from "../../../services/Chat";
import Logger from "../../../utils/logger";
import ServerMessages, { ServerMessagesEnum } from "../../../config/messages";

const fileName = "[admin][customer][index.ts]";
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
            const { locale, page, limit } = req.query;
            this.locale = (locale as string) || "en";
    
            // Parse page and limit from query params, set defaults if not provided
            const pageNumber = parseInt(page as string) || 1;
            const limitNumber = parseInt(limit as string) || 5;
    
            // Calculate the number of documents to skip
            const skip = (pageNumber - 1) * limitNumber;
    
            // Aggregation pipeline with pagination
            const result = await Customer.aggregate([
                {
                    $match: { type: 1 }
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
                {
                    $sort: { id: -1 }
                },
                {
                    $skip: skip
                },
                {
                    $limit: limitNumber
                }
            ]).exec();
            
            const totalCount = await Customer.countDocuments({ type: 1 });
    
            if (result.length > 0) {
                const totalPages = Math.ceil(totalCount / limitNumber);
                return serverResponse(
                    res,
                    HttpCodeEnum.OK,
                    ServerMessages.errorMsgLocale(this.locale, ServerMessagesEnum["customer-fetched"]),
                    { result, totalPages }
                );
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
            const result = await Customer.aggregate([
                {
                    $match: { id: id, type: 1 }
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
                return serverResponse(res, HttpCodeEnum.OK, ServerMessages.errorMsgLocale(this.locale, ServerMessagesEnum["customer-fetched"]), result);
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
    
            // Check if email already exists
            const existingUser = await Customer.findOne({ mobile_number: phone });
            if (existingUser) {
                return serverResponse(res, HttpCodeEnum.BADREQUEST, constructResponseMsg(this.locale, "email-already-exists"), {});
            }
    
            const enpassword = await Bcrypt.hash(password, 10);
    
            const userData = await Customer.create({
                name,
                mobile_number: phone,
                email,
                address,
                city: city_id,
                state: state_id,
                country: country_id,
                role_id,
                password: enpassword,
                type: 1,
                status: 1,
            });
    
            const formattedUserData = await this.fetchUserDetails(userData.id);
    
            return serverResponse(res, HttpCodeEnum.OK, constructResponseMsg(this.locale, "customer-add"), formattedUserData);
        } catch (err: any) {
            return serverErrorHandler(err, res, err.message, HttpCodeEnum.SERVERERROR, {});
        }
    }

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

        const userData: any = await Customer.findOne({ "$or": [{ email: messageToSearchWith.email }, { communication_email: messageToSearchWith.email }] });

        if (userData) {
            return Promise.resolve(userData._doc);
        }

        return Promise.resolve({ is_email_verified: false });
    }

    public async update(req: Request, res: Response): Promise<any> {
        try {
            const fn = "[update]";

            const user_id = parseInt(req.params.id);

            // Set locale
            const { locale } = req.query;
            this.locale = (locale as string) || "en";
            const { name, phone, email, address, city_id, state_id, country_id, role_id  } = req.body;

            await Customer.findOneAndUpdate({ id: user_id }, { name, phone, email, address, city_id, state_id, country_id, role_id });

            const userData: any = await this.fetchUserDetails(user_id);

            return serverResponse(res, HttpCodeEnum.OK, constructResponseMsg(this.locale, "customer-updated"), userData);
        } catch (err: any) {
            return serverErrorHandler(err, res, err.message, HttpCodeEnum.SERVERERROR, {});
        }
    }

    public async profileUpdate(req: Request, res: Response): Promise<any> {
        try {
            const fn = "[update]";

            const { user_id: userid } = req.customer;

            // Set locale
            const { locale } = req.query;
            this.locale = (locale as string) || "en";
            const { name, phone, email, gstnumber, telephonenumber, address, pincode  } = req.body;

            await Customer.findOneAndUpdate({ id: userid }, { name, phone, email, gst_no: gstnumber, telephonenumber, address, pincode });

            const userData: any = await this.fetchUserDetails(userid);

            return serverResponse(res, HttpCodeEnum.OK, constructResponseMsg(this.locale, "customer-updated"), userData);
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
            const result = await Customer.deleteOne({ id: id });

            if (result) {
                return serverResponse(res, HttpCodeEnum.OK, ServerMessages.errorMsgLocale(this.locale, ServerMessagesEnum["customer-deleted"]), result);
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
            const updationstatus = await Customer.findOneAndUpdate({ id: id }, { status: status }).lean();
            const result: any = await this.fetchUserDetails(id);
            if (updationstatus) {
                return serverResponse(res, HttpCodeEnum.OK, ServerMessages.errorMsgLocale(this.locale, ServerMessagesEnum["customer-status"]), result);
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
            const user = await Customer.findOne({ id: id }).lean();
    
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
            const updationstatus = await Customer.findOneAndUpdate({ id: id }, { password: hashedPassword }).lean();
    
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
            const user = await Customer.findOne({ id: id }).lean();
    
            if (!user) {
                throw new Error(ServerMessages.errorMsgLocale(this.locale, ServerMessagesEnum["not-found"]));
            }
    
            // Update the user's profile image
            const updateprofile = await User.findOneAndUpdate({ id: id }, { profile_img_url: product_image }).lean();
    
            if (updateprofile) {
                return serverResponse(res, HttpCodeEnum.OK, ServerMessages.errorMsgLocale(this.locale, ServerMessagesEnum["profile-img-updated"]), {});
            } else {
                throw new Error(ServerMessages.errorMsgLocale(this.locale, ServerMessagesEnum["update-failed"]));
            }
        } catch (err: any) {
            return serverErrorHandler(err, res, err.message, HttpCodeEnum.SERVERERROR, {});
        }
    }


}