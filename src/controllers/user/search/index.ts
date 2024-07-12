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
    
            let query: any = {};
    
            if (keyword) {
                query.name = { $regex: keyword, $options: 'i' };
            }
    
            if (categoryid) {
                query.category_id = categoryid;
            }
    
            let searchResults = await Product.find(query).select('-createBy -updatedBy -createdAt -updatedAt').lean();
    
            if (searchResults.length > 0) {
                // Format the response data if needed
                const formattedResults = searchResults.map((result: any) => ({
                    id: result._id,
                    name: result.name,
                    description: result.description,
                    price: result.price,
                    category_id: result.category_id,
                    status: result.status,
                    product_image: result.product_image
                    // Add other fields you want to include
                }));
    
                return serverResponse(res, HttpCodeEnum.OK, ServerMessages.errorMsgLocale(this.locale, ServerMessagesEnum["search-fetched"]), formattedResults);
            } else {
                throw new Error(ServerMessages.errorMsgLocale(this.locale, ServerMessagesEnum["not-found"]));
            }
        } catch (err: any) {
            return serverErrorHandler(err, res, err.message, HttpCodeEnum.SERVERERROR, {});
        }
    }
}    