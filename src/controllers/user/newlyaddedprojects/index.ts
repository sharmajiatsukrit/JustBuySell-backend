import { Request, Response } from "express";
import { ValidationChain } from "express-validator";
import moment from "moment";
import { Category, Product, ProductRequest } from "../../../models";
import { removeObjectKeys, serverResponse, serverErrorHandler, removeSpace, constructResponseMsg, serverInvalidRequest, groupByDate } from "../../../utils";
import { HttpCodeEnum } from "../../../enums/server";
import validate from "../productrequest/validate";
import EmailService from "../../../utils/email";
import Logger from "../../../utils/logger";
import ServerMessages, { ServerMessagesEnum } from "../../../config/messages";


const fileName = "[user][product][index.ts]";
export default class NewlyaddedproductsController {
    public locale: string = "en";
    public emailService;

    constructor() {
        this.emailService = new EmailService();
    }

    public validate(endPoint: string): ValidationChain[] {
        return validate(endPoint);
    }

    public async getList(req: Request, res: Response): Promise<any> {
        try {
            const { locale, page, limit } = req.query;
            this.locale = (locale as string) || "en";
    
            const pageNumber = parseInt(page as string) || 1;
            const limitNumber = parseInt(limit as string) || 10;
    
            // Calculate the number of documents to skip
            const skip = (pageNumber - 1) * limitNumber;
    
            // Fetch the documents with pagination and sorting
            const result = await Product.find({})
                .sort({ _id: -1 })
                .skip(skip)
                .limit(limitNumber)
                .lean();
    
            // Get the total number of documents in the Banner collection
            const totalCount = await Product.countDocuments({});
    
            if (result.length > 0) {
                const totalPages = Math.ceil(totalCount / limitNumber);
    
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
                    {
                        result: formattedResult,
                        totalCount,
                        totalPages,
                        currentPage: pageNumber
                    }
                );
            } else {
                throw new Error(ServerMessages.errorMsgLocale(this.locale, ServerMessagesEnum["not-found"]));
            }
        } catch (err: any) {
            return serverErrorHandler(err, res, err.message, HttpCodeEnum.SERVERERROR, {});
        }
    }
    

    public async getSearch(req: Request, res: Response): Promise<any> {
        try {
            const fn = "[getSearch]";
            const { locale } = req.query;
            this.locale = (locale as string) || "en";
    
            const { keyword } = req.query;
    
            if (!keyword) {
                throw new Error("Search keyword is missing.");
            }
    
            const searchResults = await Product.find({
                $or: [
                    { name: { $regex: keyword, $options: 'i' } },
                ]
            }).lean();
    
            if (searchResults.length > 0) {
                return serverResponse(res, HttpCodeEnum.OK, ServerMessages.errorMsgLocale(this.locale, ServerMessagesEnum["category-fetched"]), searchResults);
            } else {
                throw new Error(ServerMessages.errorMsgLocale(this.locale, ServerMessagesEnum["not-found"]));
            }
        } catch (err: any) {
            return serverErrorHandler(err, res, err.message, HttpCodeEnum.SERVERERROR, {});
        }
    }


}