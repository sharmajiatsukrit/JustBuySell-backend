import { Request, Response } from "express";
import { ValidationChain } from "express-validator";
import moment from "moment";
import { Category, Product, ProductRequest } from "../../../models";
import { removeObjectKeys, serverResponse, serverErrorHandler, removeSpace, constructResponseMsg, serverInvalidRequest, groupByDate } from "../../../utils";
import { HttpCodeEnum } from "../../../enums/server";
import validate from "./validate";
import EmailService from "../../../utils/email";
import Logger from "../../../utils/logger";
import ServerMessages, { ServerMessagesEnum } from "../../../config/messages";


const fileName = "[user][product][index.ts]";
export default class SearchController {
    public locale: string = "en";
    public emailService;

    constructor() {
        this.emailService = new EmailService();
    }

    public validate(endPoint: string): ValidationChain[] {
        return validate(endPoint);
    }


    public async getSearch(req: Request, res: Response): Promise<any> {
        try {
            const fn = "[getSearch]";
            const { locale } = req.query;
            this.locale = (locale as string) || "en";
    
            const { keyword, categoryid } = req.query;
    
            if (keyword && categoryid) {
                const searchResults = await Product.find({
                    $and: [
                        { name: { $regex: keyword, $options: 'i' } },
                        {category_id: categoryid }
                    ]
                }).lean();
    
                if (searchResults.length > 0) {
                    return serverResponse(res, HttpCodeEnum.OK, ServerMessages.errorMsgLocale(this.locale, ServerMessagesEnum["category-fetched"]), searchResults);
                } else {
                    throw new Error(ServerMessages.errorMsgLocale(this.locale, ServerMessagesEnum["not-found"]));
                }
            } else if (keyword) {
                const searchResults = await Product.find({
                    $or: [
                        { name: { $regex: keyword, $options: 'i' } }
                    ]
                }).lean();
    
                if (searchResults.length > 0) {
                    return serverResponse(res, HttpCodeEnum.OK, ServerMessages.errorMsgLocale(this.locale, ServerMessagesEnum["category-fetched"]), searchResults);
                } else {
                    throw new Error(ServerMessages.errorMsgLocale(this.locale, ServerMessagesEnum["not-found"]));
                }
            } else {
                throw new Error(ServerMessages.errorMsgLocale(this.locale, ServerMessagesEnum["missing-params"]));
            }
        } catch (err: any) {
            return serverErrorHandler(err, res, err.message, HttpCodeEnum.SERVERERROR, {});
        }
    }
    
    

}