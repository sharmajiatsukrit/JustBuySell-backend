import { Request, Response } from "express";
import ServerMessages, { ServerMessagesEnum } from "../../../config/messages";
import { HttpCodeEnum } from "../../../enums/server";
import { serverResponse, serverErrorHandler, constructResponseMsg } from "../../../utils";
import { Deviceid } from "../../../models";
import EmailService from "../../../utils/email";
import { ValidationChain } from "express-validator";
import validate from "./validate";

export default class BannerController {
    public locale: string = "en";
    private appURL: string = process.env.APP_URL || "";
    public emailService;

    constructor() {
        this.emailService = new EmailService();
    }

    public validate(endPoint: string): ValidationChain[] {
        return validate(endPoint);
    }

    public async addReport(req: Request, res: Response): Promise<any> {
        try {
            // Set locale
            const { locale } = req.query;
            this.locale = (locale as string) || "en";

            const { user_id: userid } = req.customer;
            const { message } = req.body;

            const adddeviceid = await Deviceid.create({ message, created_by: userid });

            return serverResponse(res, HttpCodeEnum.OK, constructResponseMsg(this.locale, "report-add"), {});
        } catch (err: any) {
            return serverErrorHandler(err, res, err.message);
        }
    }  
}