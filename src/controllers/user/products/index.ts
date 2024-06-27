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
export default class Productcontroller {
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
            const fn = "[getList]";
            // Set locale
            const { locale, page, limit } = req.query;
            this.locale = (locale as string) || "en";

            const pageNumber = parseInt(page as string) || 1;
            const limitNumber = parseInt(limit as string) || 5;
    
            // Calculate the number of documents to skip
            const skip = (pageNumber - 1) * limitNumber;
    
            // Aggregation pipeline with pagination
            const result = await Product.aggregate([
                {
                    $lookup: {
                        from: "categories",
                        localField: "category_id",
                        foreignField: "id",
                        as: "categories",
                    },
                },
                {
                    $sort: { id: -1 }
                },
                {
                    $skip: skip
                },
                {
                    $limit: limitNumber
                }
            ]).exec();
    
            // Get the total number of documents in the Product collection
            const totalCount = await Product.countDocuments({});
    
            if (result.length > 0) {
                const totalPages = Math.ceil(totalCount / limitNumber);
                return serverResponse(
                    res,
                    HttpCodeEnum.OK,
                    ServerMessages.errorMsgLocale(this.locale, ServerMessagesEnum["product-fetched"]),
                    { result, totalPages }
                );
            } else {
                throw new Error(ServerMessages.errorMsgLocale(this.locale, ServerMessagesEnum["not-found"]));
            }
        } catch (err: any) {
            return serverErrorHandler(err, res, err.message, HttpCodeEnum.SERVERERROR, {});
        }
    }

    
    public async getbyid(req: Request, res: Response): Promise<any> {
        try {
            const fn = "[getList]";
            // Set locale
            const { locale } = req.query;
            this.locale = (locale as string) || "en";

            const { id } = req.params;

            let result;
            if (id) {
                // Find by ID if provided
                result = await Product.find({id}).lean();
                if (!result) {
                    throw new Error(ServerMessages.errorMsgLocale(this.locale, ServerMessagesEnum["not-found"]));
                }
            } else {
                // Get all products sorted by ID in descending order
                result = await Product.find({}).sort([['id', 'desc']]).lean();
                if (result.length === 0) {
                    throw new Error(ServerMessages.errorMsgLocale(this.locale, ServerMessagesEnum["not-found"]));
                }
            }

            return serverResponse(res, HttpCodeEnum.OK, ServerMessages.errorMsgLocale(this.locale, ServerMessagesEnum["product-fetched"]), result);
        } catch (err: any) {
            return serverErrorHandler(err, res, err.message, HttpCodeEnum.SERVERERROR, {});
        }
    }

}