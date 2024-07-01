import { Request, Response } from "express";
import ServerMessages, { ServerMessagesEnum } from "../../../config/messages";
import { HttpCodeEnum } from "../../../enums/server";
import { serverResponse, serverErrorHandler, constructResponseMsg } from "../../../utils";
import { Deviceid } from "../../../models";
import EmailService from "../../../utils/email";
import { ValidationChain } from "express-validator";
import validate from "./validate";
import Help from "../../../models/help";

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

    public async addhelp(req: Request, res: Response): Promise<any> {
        try {
            // Set locale
            const { locale } = req.query;
            this.locale = (locale as string) || "en";

            const { email } = req.body;
            const { phone }= req.body;
            const { address} = req.body


            const adddeviceid = await Help.create({ email,phone,address });

            return serverResponse(res, HttpCodeEnum.OK, constructResponseMsg(this.locale, "help-add"), {});
        } catch (err: any) {
            return serverErrorHandler(err, res, err.message);
        }
    }  
    public async displayhelp(req: Request, res: Response): Promise<any> {
        try {
            // Set locale
            const { locale } = req.query;
            this.locale = (locale as string) || "en";

            // Fetch all Deviceid documents from MongoDB
            const help = await Help.find();

            return serverResponse(res, HttpCodeEnum.OK, constructResponseMsg(this.locale, "help-display"), {
                help
            });
        } catch (err: any) {
            return serverErrorHandler(err, res, err.message);
        }
    }
}
