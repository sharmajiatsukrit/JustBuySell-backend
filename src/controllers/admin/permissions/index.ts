import { Request, Response } from "express";
import { ValidationChain } from "express-validator";
import moment from "moment";
import { Permissions } from "../../../models";
import { removeObjectKeys, serverResponse, serverErrorHandler, removeSpace, constructResponseMsg, serverInvalidRequest, groupByDate } from "../../../utils";
import { HttpCodeEnum } from "../../../enums/server";
import validate from "./validate";
import EmailService from "../../../utils/email";
import Logger from "../../../utils/logger";
import ServerMessages, { ServerMessagesEnum } from "../../../config/messages";

const fileName = "[admin][permission][index.ts]";
export default class PermissionController {
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
            
                            
            const result = await Permissions.find({}).sort([['id', 'desc']]).lean();

            if (result.length > 0) {
                return serverResponse(res, HttpCodeEnum.OK, ServerMessages.errorMsgLocale(this.locale, ServerMessagesEnum["category-fetched"]), result);
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
            const result: any = await Permissions.find({ id: id }).lean();
            console.log(result);
            
            if (result.length > 0) {
                return serverResponse(res, HttpCodeEnum.OK, ServerMessages.errorMsgLocale(this.locale, ServerMessagesEnum["category-fetched"]), result);
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

            const { name, description, parent_id, status} = req.body;
            // Logger.info(`${fileName + fn} req.body: ${JSON.stringify(req.body)}`);

            let result: any;

            result = await Permissions.create({
                    name:name,
                    description:description,
                    parent_id:parent_id,
                    status: status
                });
            

            return serverResponse(res, HttpCodeEnum.OK, constructResponseMsg(this.locale, "category-add"), result.doc);
        } catch (err: any) {
            return serverErrorHandler(err, res, err.message, HttpCodeEnum.SERVERERROR, {});
        }
    }

    //Update
    public async update(req: Request, res: Response): Promise<any> {
        try {
            const fn = "[update]";

            const  id  = parseInt(req.params.id);
            Logger.info(`${fileName + fn} category_id: ${id}`);

            // Set locale
            const { locale } = req.query;
            this.locale = (locale as string) || "en";
            const { name, description, parent_id, status} = req.body;
            
            let result: any = await Permissions.findOneAndUpdate(
                { id: id },
                {
                    name: name,
                    description:description,
                    parent_id:parent_id,
                    status: status
                });

            const updatedData: any = await Permissions.find({ id: id }).lean();

            return serverResponse(res, HttpCodeEnum.OK, constructResponseMsg(this.locale, "category-update"), updatedData);
        } catch (err: any) {
            return serverErrorHandler(err, res, err.message, HttpCodeEnum.SERVERERROR, {});
        }
    }

    // Delete
    public async delete(req: Request, res: Response): Promise<any> {
        try {
            const fn ="[delete]";
            // Set locale
            const { locale } = req.query;
            this.locale = (locale as string) || "en";

            const id = parseInt(req.params.id);
            const result = await Permissions.deleteOne({ id: id });

            if (result) {
                return serverResponse(res, HttpCodeEnum.OK, ServerMessages.errorMsgLocale(this.locale, ServerMessagesEnum["category-delete"]), result);
            } else {
                throw new Error(ServerMessages.errorMsgLocale(this.locale, ServerMessagesEnum["not-found"]));
            }
        } catch (err: any) {
            return serverErrorHandler(err, res, err.message, HttpCodeEnum.SERVERERROR, {});
        }
    }

    // Status
    public async status(req: Request, res: Response): Promise<any> {
        try {
            const fn ="[status]";
            // Set locale
            const { locale } = req.query;
            this.locale = (locale as string) || "en";

            const id = parseInt(req.params.id);
            const { status } = req.body;
            const updationstatus = await Permissions.findOneAndUpdate({ id: id }, {status:status}).lean();
            const updatedData: any = await Permissions.find({ id: id }).lean();
            if (updationstatus) {
                return serverResponse(res, HttpCodeEnum.OK, ServerMessages.errorMsgLocale(this.locale, ServerMessagesEnum["category-status"]), updatedData);
            } else {
                throw new Error(ServerMessages.errorMsgLocale(this.locale, ServerMessagesEnum["not-found"]));
            }
        } catch (err: any) {
            return serverErrorHandler(err, res, err.message, HttpCodeEnum.SERVERERROR, {});
        }
    }

}