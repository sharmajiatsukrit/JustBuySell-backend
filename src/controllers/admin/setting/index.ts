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

const fileName = "[admin][setting][index.ts]";
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
            const { locale,key } = req.query;
            this.locale = (locale as string) || "en";

            const results = await Setting.findOne({ key: key }).select("value").lean();

            if (results) {
                return serverResponse(res, HttpCodeEnum.OK, ServerMessages.errorMsgLocale(this.locale, ServerMessagesEnum["settings-fetched"]), { data: results.value });
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
            const { locale,key } = req.query;
            this.locale = (locale as string) || "en";

            const { value } = req.body;
            // Logger.info(`${fileName + fn} req.body: ${JSON.stringify(req.body)}`);

            
            let result: any = await Setting.findOneAndUpdate(
                { key: key },
                {
                    value:value,
                    created_by: req.user.object_id
                });

            const updatedData: any = await Setting.findOne({ key: key }).lean();

            return serverResponse(res, HttpCodeEnum.OK, constructResponseMsg(this.locale, "settings-saved"), updatedData.value);
        } catch (err: any) {
            return serverErrorHandler(err, res, err.message, HttpCodeEnum.SERVERERROR, {});
        }
    }



}