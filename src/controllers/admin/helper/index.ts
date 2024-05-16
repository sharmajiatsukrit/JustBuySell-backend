import { Request, Response } from "express";
import { ValidationChain } from "express-validator";
import moment from "moment";
import { Category,Unit } from "../../../models";
import { removeObjectKeys, serverResponse, serverErrorHandler, removeSpace, constructResponseMsg, serverInvalidRequest, groupByDate } from "../../../utils";
import { HttpCodeEnum } from "../../../enums/server";
import validate from "./validate";
import EmailService from "../../../utils/email";
import Logger from "../../../utils/logger";
import ServerMessages, { ServerMessagesEnum } from "../../../config/messages";

const fileName = "[admin][helper][index.ts]";
export default class HelperController {
    public locale: string = "en";
    public emailService;

    constructor() {
        this.emailService = new EmailService();
    }

    public validate(endPoint: string): ValidationChain[] {
        return validate(endPoint);
    }


    // Checked
    public async getCategories(req: Request, res: Response): Promise<any> {
        try {
            const fn ="[getCategories]";
            // Set locale
            const { locale } = req.query;
            this.locale = (locale as string) || "en";
            
                            
            const result = await Category.find({}).where('status').equals(true).sort([['id', 'desc']]).select('id name').lean();

            if (result.length > 0) {
                return serverResponse(res, HttpCodeEnum.OK, ServerMessages.errorMsgLocale(this.locale, ServerMessagesEnum["category-fetched"]), result);
            } else {
                throw new Error(ServerMessages.errorMsgLocale(this.locale, ServerMessagesEnum["not-found"]));
            }
        } catch (err: any) {
            return serverErrorHandler(err, res, err.message, HttpCodeEnum.SERVERERROR, {});
        }
    }


    public async getUnits(req: Request, res: Response): Promise<any> {
        try {
            const fn ="[getUnits]";
            // Set locale
            const { locale } = req.query;
            this.locale = (locale as string) || "en";
            
                            
            const result = await Unit.find({}).where('status').equals(true).sort([['id', 'desc']]).select('id name').lean();

            if (result.length > 0) {
                return serverResponse(res, HttpCodeEnum.OK, ServerMessages.errorMsgLocale(this.locale, ServerMessagesEnum["unit-fetched"]), result);
            } else {
                throw new Error(ServerMessages.errorMsgLocale(this.locale, ServerMessagesEnum["not-found"]));
            }
        } catch (err: any) {
            return serverErrorHandler(err, res, err.message, HttpCodeEnum.SERVERERROR, {});
        }
    }
    

}