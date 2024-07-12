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
            const limitNumber = parseInt(limit as string) || 10;
    
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
                },
                {
                    $addFields: {
                        "full_image_url": {
                            $concat: [`${process.env.APP_URL}/`, "$product_image"]
                        }
                    }
                },
                {
                    $project: {
                        _id: 0, // Exclude _id field
                        id: 1,
                        name: 1,
                        description: 1,
                        price: 1,
                        category_id: 1,
                        unitId: 1,
                        pack: 1,
                        product_image: "$full_image_url", // Rename full_image_url to product_image
                        status: 1,
                        categories: 1
                        // Add other fields as needed
                    }
                }
            ]).exec();
    
            // Get the total number of documents in the Product collection
            const totalCount = await Product.countDocuments({});
    
            if (result.length > 0) {
                const totalPages = Math.ceil(totalCount / limitNumber);
    
                // Format the data
                const formattedResults = result.map(item => ({
                    id: item.id,
                    name: item.name,
                    description: item.description,
                    price: item.price,
                    categoryId: item.category_id,
                    unitId: item.unitId,
                    pack: item.pack,
                    productImage: item.product_image,
                    status: item.status,
                    categories: item.categories.map((category: any) => ({
                        id: category.id,
                        name: category.name,
                        // Add other fields as needed
                    }))
                }));
    
                // Return formatted response
                return serverResponse(
                    res,
                    HttpCodeEnum.OK,
                    ServerMessages.errorMsgLocale(this.locale, ServerMessagesEnum["product-fetched"]),
                    { data: formattedResults, totalPages, currentPage: pageNumber, totalCount }
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