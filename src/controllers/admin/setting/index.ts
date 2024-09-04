import { Request, Response } from "express";
import { ValidationChain } from "express-validator";
import moment from "moment";
import { Setting } from "../../../models";
import { removeObjectKeys, serverResponse, serverErrorHandler, removeSpace, constructResponseMsg, serverInvalidRequest, groupByDate } from "../../../utils";
import { HttpCodeEnum } from "../../../enums/server";
import validate from "./validate";
import EmailService from "../../../utils/email";
import Logger from "../../../utils/logger";
import ServerMessages, { ServerMessagesEnum } from "../../../config/messages";

const fileName = "[admin][faq][index.ts]";
export default class SettingController {
    public locale: string = "en";
    public emailService;

    constructor() {
        this.emailService = new EmailService();
    }

    public validate(endPoint: string): ValidationChain[] {
        return validate(endPoint);
    }

    // Checked
    public async getSettings(req: Request, res: Response): Promise<any> {
        try {
            const fn = "[getList]";
            // Set locale
            const { locale } = req.query;
            this.locale = (locale as string) || "en";



            const results = await Setting.findOne({ id: 2 }).lean();

            if (results) {
                return serverResponse(res, HttpCodeEnum.OK, ServerMessages.errorMsgLocale(this.locale, ServerMessagesEnum["settings-fetched"]), { data: results });
            } else {
                throw new Error(ServerMessages.errorMsgLocale(this.locale, ServerMessagesEnum["not-found"]));
            }
        } catch (err: any) {
            return serverErrorHandler(err, res, err.message, HttpCodeEnum.SERVERERROR, {});
        }
    }

    //add
    public async saveSettings(req: Request, res: Response): Promise<any> {
        try {
            const fn = "[add]";
            // Set locale
            const { locale } = req.query;
            this.locale = (locale as string) || "en";

            const { app_name, support_email, support_phone, office_address } = req.body;
            // Logger.info(`${fileName + fn} req.body: ${JSON.stringify(req.body)}`);

            // let result: any;

            // result = await Setting.create({
            //     app_name: app_name,
            //     support_email: support_email,
            //     support_phone: support_phone,
            //     office_address: office_address,
            //     created_by: req.user.object_id
            // });
            let result: any = await Setting.findOneAndUpdate(
                { id: 2 },
                {
                    app_name: app_name,
                    support_email: support_email,
                    support_phone: support_phone,
                    office_address: office_address,
                    created_by: req.user.object_id
                });

            const updatedData: any = await Setting.findOne({ id: 2 }).lean();

            return serverResponse(res, HttpCodeEnum.OK, constructResponseMsg(this.locale, "settings-saved"), result.doc);
        } catch (err: any) {
            return serverErrorHandler(err, res, err.message, HttpCodeEnum.SERVERERROR, {});
        }
    }



}