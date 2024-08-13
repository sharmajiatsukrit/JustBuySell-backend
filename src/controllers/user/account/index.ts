import { Request, Response } from "express";
import { ValidationChain } from "express-validator";
import moment from "moment";
import { Customer } from "../../../models";
import { removeObjectKeys, serverResponse, serverErrorHandler, removeSpace, constructResponseMsg, serverInvalidRequest, groupByDate } from "../../../utils";
import { HttpCodeEnum } from "../../../enums/server";
import validate from "./validate";
import EmailService from "../../../utils/email";
import Logger from "../../../utils/logger";
import ServerMessages, { ServerMessagesEnum } from "../../../config/messages";


const fileName = "[user][account][index.ts]";
export default class AccountController {
    public locale: string = "en";
    public emailService;

    constructor() {
        this.emailService = new EmailService();
    }

    public validate(endPoint: string): ValidationChain[] {
        return validate(endPoint);
    }


    // Checked
    public async getMyProfile(req: Request, res: Response): Promise<any> {
        try {
            const fn = "[getById]";
            // Set locale
            const { locale } = req.query;
            this.locale = (locale as string) || "en";

            const results: any = await Customer.findOne({ _id: req.customer.object_id }).lean();
            if (results.company_logo.length) {

            }
            if (results) {
                return serverResponse(res, HttpCodeEnum.OK, ServerMessages.errorMsgLocale(this.locale, ServerMessagesEnum["customer-fetched"]), results);
            } else {
                throw new Error(ServerMessages.errorMsgLocale(this.locale, ServerMessagesEnum["not-found"]));
            }
        } catch (err: any) {
            return serverErrorHandler(err, res, err.message, HttpCodeEnum.SERVERERROR, {});
        }
    }

    public async updateMyProfile(req: Request, res: Response): Promise<any> {
        try {
            const fn = "[updateMyProfile]";

            // Set locale
            const { locale } = req.query;
            this.locale = (locale as string) || "en";
            const { name, phone, email, company_name, brand_name, gst, telephone, company_email, address_line_1, address_line_2, open_time, close_time, parent_id, status } = req.body;
            let result: any = await Customer.findOneAndUpdate(
                { id: req.customer.user_id },
                {
                    name: name,
                    email: email,
                    company_name: company_name,
                    brand_name: brand_name,
                    gst: gst,
                    telephone: telephone,
                    company_email: company_email,
                    address_line_1: address_line_1,
                    address_line_2: address_line_2,
                    open_time: open_time,
                    close_time: close_time,
                    status: status
                });

            console.log(result);
            let company_logo: any;
            if (req.file) {
                company_logo = req?.file?.filename;
                let resultimage: any = await Customer.findOneAndUpdate({ _id: req.customer.object_id }, { company_logo: company_logo });
            }
            const userData: any = await Customer.findOne({ _id: req.customer.object_id }).lean();

            return serverResponse(res, HttpCodeEnum.OK, constructResponseMsg(this.locale, "customer-updated"), userData);
        } catch (err: any) {
            return serverErrorHandler(err, res, err.message, HttpCodeEnum.SERVERERROR, {});
        }
    }
}