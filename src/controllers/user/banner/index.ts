import { Request, Response } from "express";
import { ValidationChain } from "express-validator";
import validator from "validator";
import Bcrypt from "bcryptjs";
import { DateTime } from "luxon";
import moment from "moment";
import { Banner } from "../../../models";
import { removeObjectKeys, serverResponse, serverErrorHandler, removeSpace, constructResponseMsg, serverInvalidRequest, groupByDate } from "../../../utils";
import { HttpCodeEnum } from "../../../enums/server";
import validate from "./validate";
import EmailService from "../../../utils/email";
import { getPostsForAdmin, getPostsForAdminBySubscriberId, getChatCount, getPostCount, postDelete } from "../../../services/Chat";
import Logger from "../../../utils/logger";
import ServerMessages, { ServerMessagesEnum } from "../../../config/messages";
//import mongoose from "mongoose";

const fileName = "[admin][banner][index.ts]";
export default class BannerController {
    public locale: string = "en";
    public emailService;

    constructor() {
        this.emailService = new EmailService();
    }

    public validate(endPoint: string): ValidationChain[] {
        return validate(endPoint);
    }

    // Set locale
    public async getList(req: Request, res: Response): Promise<any> {
        try {
            const { locale } = req.query;
            this.locale = (locale as string) || "en";

            // Fetch documents where status is true, without pagination
            const result = await Banner.find({ status: true })
                .sort({ id: -1 }) // Sort by id in descending order if needed
                .lean();

            if (result.length > 0) {
                // Format the data before sending the response
                const formattedResult = result.map((item: any) => ({
                    id: item.id,
                    name: item.name,
                    bannerimg: `${process.env.APP_URL}/${item.bannerimg}`, // Full URL of bannerimg
                    url: item.url,
                    status: item.status,
                    // Add other fields as needed
                }));

                return serverResponse(
                    res,
                    HttpCodeEnum.OK,
                    ServerMessages.errorMsgLocale(this.locale, ServerMessagesEnum["banner-fetched"]),
                    formattedResult
                );
            } else {
                throw new Error(ServerMessages.errorMsgLocale(this.locale, ServerMessagesEnum["not-found"]));
            }
        } catch (err: any) {
            return serverErrorHandler(err, res, err.message, HttpCodeEnum.SERVERERROR, {});
        }
    }


    public async getDetailsById(req: Request, res: Response): Promise<any> {
        try {
            const fn = "[getDetailsById]";
            // Set locale
            const { locale } = req.query;
            this.locale = (locale as string) || "en";

            // Get the id from the request parameters and parse it as an integer
            const id = parseInt(req.params.id);

            // Fetch the document from the Banner collection by id
            const result = await Banner.findOne({ id }).lean();

            if (result) {
                // Format the result data
                const formattedResult = {
                    id: result.id,
                    name: result.name,
                    banner: `${process.env.APP_URL}/${result.banner}`,
                    external_url: result.external_url,
                    status: result.status,
                    // Add other fields as needed
                };

                return serverResponse(res, HttpCodeEnum.OK, ServerMessages.errorMsgLocale(this.locale, ServerMessagesEnum["banner-fetched"]), formattedResult);
            } else {
                throw new Error(ServerMessages.errorMsgLocale(this.locale, ServerMessagesEnum["not-found"]));
            }
        } catch (err: any) {
            return serverErrorHandler(err, res, err.message, HttpCodeEnum.SERVERERROR, {});
        }
    }

    //    
}