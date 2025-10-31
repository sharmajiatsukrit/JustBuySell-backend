import { Request, Response } from "express";
import { ValidationChain } from "express-validator";
import moment from "moment";
import { Roles, Permissions ,User} from "../../../models";
import { removeObjectKeys, serverResponse, serverErrorHandler, removeSpace, constructResponseMsg, serverInvalidRequest, groupByDate } from "../../../utils";
import { HttpCodeEnum } from "../../../enums/server";
import validate from "./validate";
import EmailService from "../../../utils/email";
import Logger from "../../../utils/logger";
import ServerMessages, { ServerMessagesEnum } from "../../../config/messages";

const fileName = "[admin][roles][index.ts]";
export default class RolesController {
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
            const { locale, page, limit, search } = req.query;
            this.locale = (locale as string) || "en";

            const pageNumber = parseInt(page as string) || 1;
            const limitNumber = parseInt(limit as string) || 10;
            const skip = (pageNumber - 1) * limitNumber;

            const filter:any = {is_deleted : false};
            if (search) {
                filter.$or = [
                    { name: { $regex: search, $options: 'i' } }
                ];
            }
            const results = await Roles.find(filter)
                .sort({ _id: -1 }) // Sort by _id in descending order
                .skip(skip)
                .limit(limitNumber)
                .lean();

            // Get the total number of documents in the Category collection
            const totalCount = await Roles.countDocuments(filter);

            // Calculate total pages
            const totalPages = Math.ceil(totalCount / limitNumber);

            if (results.length > 0) {


                return serverResponse(
                    res,
                    HttpCodeEnum.OK,
                    ServerMessages.errorMsgLocale(this.locale, ServerMessagesEnum["role-fetched"]),
                    { data: results, totalCount, totalPages, currentPage: pageNumber }
                );
            } else {
                throw new Error(ServerMessages.errorMsgLocale(this.locale, ServerMessagesEnum["not-found"]));
            }
        } catch (err: any) {
            return serverErrorHandler(err, res, err.message, HttpCodeEnum.SERVERERROR, {});
        }
    }

    public async getPermissions(req: Request, res: Response): Promise<any> {
        try {
            const { locale, } = req.query;
            this.locale = (locale as string) || "en";

            const results = await Permissions.find({status:true})
                .sort({ _id: -1 }) 
                .lean();
            if (results.length > 0) {
                return serverResponse(
                    res,
                    HttpCodeEnum.OK,
                    ServerMessages.errorMsgLocale(this.locale, ServerMessagesEnum["permission-fetched"]),
                    { data: results }
                );
            } else {
                throw new Error(ServerMessages.errorMsgLocale(this.locale, ServerMessagesEnum["not-found"]));
            }
        } catch (err: any) {
            return serverErrorHandler(err, res, err.message, HttpCodeEnum.SERVERERROR, {});
        }
    }
    // Checked
    public async getById(req: Request, res: Response): Promise<any> {
        try {
            const fn = "[getDetailsById]";
            // Set locale
            const { locale } = req.query;
            this.locale = (locale as string) || "en";

            const id = parseInt(req.params.id);
            const result: any = await Roles.findOne({ id: id }).lean();



            if (result) {
                return serverResponse(res, HttpCodeEnum.OK, ServerMessages.errorMsgLocale(this.locale, ServerMessagesEnum["role-fetched"]), result);
            } else {
                throw new Error(ServerMessages.errorMsgLocale(this.locale, ServerMessagesEnum["not-found"]));
            }
        } catch (err: any) {
            return serverErrorHandler(err, res, err.message, HttpCodeEnum.SERVERERROR, {});
        }
    }



    // Delete
    public async delete(req: Request, res: Response): Promise<any> {
        try {
            const fn = "[delete]";
            // Set locale
            const { locale } = req.query;
            this.locale = (locale as string) || "en";

            const id = parseInt(req.params.id);
            const result = await Roles.findOneAndUpdate({ id: id },{is_deleted:true});

            if (result) {
                return serverResponse(res, HttpCodeEnum.OK, ServerMessages.errorMsgLocale(this.locale, ServerMessagesEnum["role-delete"]), result);
            } else {
                throw new Error(ServerMessages.errorMsgLocale(this.locale, ServerMessagesEnum["not-found"]));
            }
        } catch (err: any) {
            return serverErrorHandler(err, res, err.message, HttpCodeEnum.SERVERERROR, {});
        }
    }


    //add
    public async add(req: Request, res: Response): Promise<any> {
        try {
            const fn = "[add]";
            // Set locale
            const { locale } = req.query;
            this.locale = (locale as string) || "en";

            const { name, description, permissions, status } = req.body;

            let result: any;
            const permission = await Permissions.find({ id: permissions }).select('id name description').lean();
            
            result = await Roles.create({
                name: name,
                description: description,
                permissions: permission,
                status: status
            });

            return serverResponse(res, HttpCodeEnum.OK, constructResponseMsg(this.locale, "role-add"), {});
        } catch (err: any) {
            return serverErrorHandler(err, res, err.message, HttpCodeEnum.SERVERERROR, {});
        }
    }
    
    //Update
    public async update(req: Request, res: Response): Promise<any> {
        try {
            const fn = "[update]";

            const id = parseInt(req.params.id);
            Logger.info(`${fileName + fn} role_id: ${id}`);

            // Set locale
            const { locale } = req.query;
            this.locale = (locale as string) || "en";
            const { name, description, permissions, status } = req.body;
            const permission = await Permissions.find({ id: permissions }).select('id name description').lean();
            let result: any = await Roles.findOneAndUpdate(
                { id: id },
                {
                    name: name,
                    description: description,
                    permissions: permission,
                    status: status
                });

            const updatedData: any = await Roles.find({ id: id }).lean();

            return serverResponse(res, HttpCodeEnum.OK, constructResponseMsg(this.locale, "role-update"), updatedData);
        } catch (err: any) {
            return serverErrorHandler(err, res, err.message, HttpCodeEnum.SERVERERROR, {});
        }
    }
    
    // Delete
    // public async delete(req: Request, res: Response): Promise<any> {
    //     try {
    //         const fn = "[delete]";
    //         // Set locale
    //         const { locale } = req.query;
    //         this.locale = (locale as string) || "en";

    //         const id = parseInt(req.params.id);
    //         // const result = await Roles.deleteOne({ id: id });
    //         const user: any = await User.findOne({ id: req.user.user_id }).lean();
    //         let result: any = await Roles.findOneAndUpdate({ id: id }, { isDeleted: true, deletedAt: new Date(), updated_by: user._id });

    //         if (result) {
    //             return serverResponse(res, HttpCodeEnum.OK, constructResponseMsg(this.locale, "role-delete"), {});
    //         } else {
    //             throw new Error(ServerMessages.errorMsgLocale(this.locale, ServerMessagesEnum["not-found"]));
    //         }
    //     } catch (err: any) {
    //         return serverErrorHandler(err, res, err.message, HttpCodeEnum.SERVERERROR, {});
    //     }
    // }

    // Status
    public async status(req: Request, res: Response): Promise<any> {
        try {
            const fn = "[status]";
            // Set locale
            const { locale } = req.query;
            this.locale = (locale as string) || "en";

            const id = parseInt(req.params.id);
            const { status } = req.body;
            const updationstatus = await Roles.findOneAndUpdate({ id: id }, { status: status }).lean();
            const updatedData: any = await Roles.find({ id: id }).lean();
            if (updationstatus) {
                return serverResponse(res, HttpCodeEnum.OK, ServerMessages.errorMsgLocale(this.locale, ServerMessagesEnum["role-status"]), updatedData);
            } else {
                throw new Error(ServerMessages.errorMsgLocale(this.locale, ServerMessagesEnum["not-found"]));
            }
        } catch (err: any) {
            return serverErrorHandler(err, res, err.message, HttpCodeEnum.SERVERERROR, {});
        }
    }

}