import { Request, Response } from "express";
import { ValidationChain } from "express-validator";
import moment from "moment";
import { Category, Product, ProductRequest, Watchlist } from "../../../models";
import { removeObjectKeys, serverResponse, serverErrorHandler, removeSpace, constructResponseMsg, serverInvalidRequest, groupByDate } from "../../../utils";
import { HttpCodeEnum } from "../../../enums/server";
import validate from "./validate";
import EmailService from "../../../utils/email";
import Logger from "../../../utils/logger";
import ServerMessages, { ServerMessagesEnum } from "../../../config/messages";


const fileName = "[user][product][index.ts]";
export default class WatchlistController {
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

            const skip = (pageNumber - 1) * limitNumber;

            const result = await Watchlist.find({})
                .sort({ id: -1 })
                .skip(skip)
                .limit(limitNumber)
                .lean();

            const totalCount = await Watchlist.countDocuments({});

            if (result.length > 0) {
                const totalPages = Math.ceil(totalCount / limitNumber);
                const formattedResult = result.map(item => ({
                    id: item.id,
                    name: item.name,
                    status: item.status
                    // Add other fields as needed
                }));

                return serverResponse(
                    res,
                    HttpCodeEnum.OK,
                    ServerMessages.errorMsgLocale(this.locale, ServerMessagesEnum["watchlist-fetched"]),
                    { result: formattedResult, totalCount, totalPages, currentPage: pageNumber }
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
                result = await Watchlist.find({ id }).lean();
                if (result.length === 0) {
                    throw new Error(ServerMessages.errorMsgLocale(this.locale, ServerMessagesEnum["not-found"]));
                } else {
                    // Format the result if found in Watchlist
                    result = result.map(item => ({
                        id: item.id,
                        name: item.name,
                        status: item.status
                        // add other fields as needed
                    }));
                }
            } else {
                // Get all products sorted by ID in descending order
                result = await Product.find({}).sort({ id: -1 }).lean();
                if (result.length === 0) {
                    throw new Error(ServerMessages.errorMsgLocale(this.locale, ServerMessagesEnum["not-found"]));
                } else {
                    // Format the product results if needed
                    result = result.map(product => ({
                        id: product.id,
                        name: product.name,
                        description: product.description,
                        price: product.price,
                        category_id: product.category_id,
                        unit_id: product.unit_id,
                        product_image: product.product_image,
                        status: product.status
                        // add other fields as needed
                    }));
                }
            }
    
            return serverResponse(res, HttpCodeEnum.OK, ServerMessages.errorMsgLocale(this.locale, ServerMessagesEnum["watchlist-fetched"]), result);
        } catch (err: any) {
            return serverErrorHandler(err, res, err.message, HttpCodeEnum.SERVERERROR, {});
        }
    }
       public async addWatchlist(req: Request, res: Response): Promise<any> {
        try {
            const fn = "[updateProfileImg]";
            // Set locale
            const { locale } = req.query;
            this.locale = (locale as string) || "en";

            const { name } = req.body;

            const banneradd = await Watchlist.create({
                name: name,
            });

            if (banneradd) {
                return serverResponse(res, HttpCodeEnum.OK, ServerMessages.errorMsgLocale(this.locale, ServerMessagesEnum["watchlist-create"]), {});
            } else {
                throw new Error(ServerMessages.errorMsgLocale(this.locale, ServerMessagesEnum["update-failed"]));
            }
        } catch (err: any) {
            console.error(err);
            return serverErrorHandler(err, res, err.message, HttpCodeEnum.SERVERERROR, {});
        }
    }


    public async editWatchlist(req: Request, res: Response): Promise<any> {
        try {
            const fn = "[editWatchlist]";
            // Set locale
            const { locale } = req.query;
            this.locale = (locale as string) || "en";

            const { id } = req.params; // Assuming the ID is passed as a URL parameter
            const { name } = req.body;

            const watchlist = await Watchlist.find({ id });

            watchlist[0].name = name;
            await watchlist[0].save();

            return serverResponse(res, HttpCodeEnum.OK, ServerMessages.errorMsgLocale(this.locale, ServerMessagesEnum["watchlist-update"]), {});
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
            const watchlist = await Watchlist.find({id: id});

            if (!watchlist) {
                return serverResponse(res, HttpCodeEnum.NOTFOUND, ServerMessages.errorMsgLocale(this.locale, ServerMessagesEnum["watchlist-notfound"]), {});
            }

            await Watchlist.deleteOne();

            console.log(`${fn} Watchlist with id: ${id} deleted successfully`);

            return serverResponse(res, HttpCodeEnum.OK, ServerMessages.errorMsgLocale(this.locale, ServerMessagesEnum["watchlist-delete"]), {});
        } catch (err: any) {
            return serverErrorHandler(err, res, err.message, HttpCodeEnum.SERVERERROR, {});
        }
    }
}