import { Request, Response } from "express";
import { ValidationChain } from "express-validator";
import moment from "moment";
import { Category, Product, ProductRequest, Watchlist, Productwatch  } from "../../../models";
import { removeObjectKeys, serverResponse, serverErrorHandler, removeSpace, constructResponseMsg, serverInvalidRequest, groupByDate } from "../../../utils";
import { HttpCodeEnum } from "../../../enums/server";
import validate from "./validate";
import EmailService from "../../../utils/email";
import Logger from "../../../utils/logger";
import ServerMessages, { ServerMessagesEnum } from "../../../config/messages";

const fileName = "[user][product][index.ts]";
export default class Productwatchlist {
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
            const result = await Productwatch.aggregate([
                {
                    $lookup: {
                        from: "watchlists",
                        localField: "watchlistid",
                        foreignField: "id",
                        as: "watchlist",
                    },
                },
                {
                    $lookup: {
                        from: "products",
                        localField: "productid",
                        foreignField: "id",
                        as: "products",
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
    
            // Get the total number of documents in the Productwatch collection
            const totalCount = await Productwatch.countDocuments({});
    
            if (result.length > 0) {
                const totalPages = Math.ceil(totalCount / limitNumber);
                
                return serverResponse(
                    res,
                    HttpCodeEnum.OK,
                    ServerMessages.errorMsgLocale(this.locale, ServerMessagesEnum["productwatch-fetched"]),
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
                result = await Productwatch.aggregate([
                    {
                        $match: { id: parseInt(id, 10) }, // Ensure id is parsed as an integer
                    },
                    {
                        $lookup: {
                            from: "watchlists",
                            localField: "watchlistid",
                            foreignField: "id",
                            as: "watchlist",
                        },
                    },
                    {
                        $lookup: {
                            from: "products",
                            localField: "productid",
                            foreignField: "id",
                            as: "products",
                        },
                    },
                    {
                        $sort: { id: -1 }
                    }
                ]).exec();
    
                if (!result || result.length === 0) {
                    throw new Error(ServerMessages.errorMsgLocale(this.locale, ServerMessagesEnum["not-found"]));
                }
            } else {
                // Get all products sorted by ID in descending order
                result = await Product.find({}).sort([['id', 'desc']]).lean();
                if (result.length === 0) {
                    throw new Error(ServerMessages.errorMsgLocale(this.locale, ServerMessagesEnum["not-found"]));
                }
            }
    
            return serverResponse(res, HttpCodeEnum.OK, ServerMessages.errorMsgLocale(this.locale, ServerMessagesEnum["productwatch-fetched"]), result);
        } catch (err: any) {
            return serverErrorHandler(err, res, err.message, HttpCodeEnum.SERVERERROR, {});
        }
    }
    

    public async addProductWatch(req: Request, res: Response): Promise<any> {
        try {
            const fn = "[updateProfileImg]";
            // Set locale
            const { locale } = req.query;
            this.locale = (locale as string) || "en";

            const { watchlistid, productid } = req.body;

            const banneradd = await Productwatch.create({
                watchlistid,
                productid
            });

            if (banneradd) {
                return serverResponse(res, HttpCodeEnum.OK, ServerMessages.errorMsgLocale(this.locale, ServerMessagesEnum["productwatch-create"]), {});
            } else {
                throw new Error(ServerMessages.errorMsgLocale(this.locale, ServerMessagesEnum["update-failed"]));
            }
        } catch (err: any) {
            console.error(err);
            return serverErrorHandler(err, res, err.message, HttpCodeEnum.SERVERERROR, {});
        }
    }


    public async editproductWatch(req: Request, res: Response): Promise<any> {
        try {
            const fn = "[editWatchlist]";
            // Set locale
            const { locale } = req.query;
            this.locale = (locale as string) || "en";

            const { id } = req.params; // Assuming the ID is passed as a URL parameter
            const {  watchlistid,
                productid } = req.body;

            const watchlist = await Productwatch.find({ id });

            watchlist[0].watchlistid = watchlistid;
            watchlist[0].productid = productid;
            await watchlist[0].save();

            return serverResponse(res, HttpCodeEnum.OK, ServerMessages.errorMsgLocale(this.locale, ServerMessagesEnum["productwatch-update"]), {});
        } catch (err: any) {
            console.error(err);
            return serverErrorHandler(err, res, err.message, HttpCodeEnum.SERVERERROR, {});
        }
    }

    public async deleteWatchlist(req: Request, res: Response): Promise<any> {
        try {
            const fn = "[deleteWatchlist]";
            // Set locale
            const { locale } = req.query;
            this.locale = (locale as string) || "en";

            const { id } = req.params; // Assuming the ID is passed as a URL parameter

            // Log the id for debugging purposes
            console.log(`${fn} Attempting to delete watchlist with id: ${id}`);

            // Find the watchlist by id
            const watchlist = await Productwatch.find({ id: id });

            if (!watchlist) {
                return serverResponse(res, HttpCodeEnum.NOTFOUND, ServerMessages.errorMsgLocale(this.locale, ServerMessagesEnum["productwatch-notfound"]), {});
            }

            await Watchlist.deleteOne();

            console.log(`${fn} Watchlist with id: ${id} deleted successfully`);

            return serverResponse(res, HttpCodeEnum.OK, ServerMessages.errorMsgLocale(this.locale, ServerMessagesEnum["productwatch-delete"]), {});
        } catch (err: any) {
            return serverErrorHandler(err, res, err.message, HttpCodeEnum.SERVERERROR, {});
        }
    }
}