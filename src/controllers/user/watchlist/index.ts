import { Request, Response } from "express";
import { ValidationChain } from "express-validator";
import moment from "moment";
import { Category, Product, ProductRequest, Watchlist, WatchlistItem } from "../../../models";
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



    // Checked
    public async getList(req: Request, res: Response): Promise<any> {
        try {
            const fn = "[getList]";
            // Set locale
            const { locale, page, limit, search } = req.query;
            this.locale = (locale as string) || "en";

            const pageNumber = parseInt(page as string) || 1;
            const limitNumber = parseInt(limit as string) || 10;
            const skip = (pageNumber - 1) * limitNumber;

            const results = await Watchlist.find({ created_by: req.customer.object_id })
                .sort({ _id: -1 }) // Sort by _id in descending order
                .skip(skip)
                .limit(limitNumber)
                .lean();

            const totalCount = await Watchlist.countDocuments({ created_by: req.customer.object_id });
            const totalPages = Math.ceil(totalCount / limitNumber);

            if (results.length > 0) {
                return serverResponse(res, HttpCodeEnum.OK, ServerMessages.errorMsgLocale(this.locale, ServerMessagesEnum["watchlist-fetched"]), { data: results, totalCount, totalPages, currentPage: pageNumber });
            } else {
                throw new Error(ServerMessages.errorMsgLocale(this.locale, ServerMessagesEnum["not-found"]));
            }
        } catch (err: any) {
            return serverErrorHandler(err, res, err.message, HttpCodeEnum.SERVERERROR, {});
        }
    }

    // Checked
    public async getById(req: Request, res: Response): Promise<any> {
        try {
            const fn = "[getById]";
            // Set locale
            const { locale } = req.query;
            this.locale = (locale as string) || "en";

            const id = parseInt(req.params.id);
            const result: any = await Watchlist.findOne({ id: id }).lean();


            if (result) {
                return serverResponse(res, HttpCodeEnum.OK, ServerMessages.errorMsgLocale(this.locale, ServerMessagesEnum["watchlist-fetched"]), result);
            } else {
                throw new Error(ServerMessages.errorMsgLocale(this.locale, ServerMessagesEnum["not-found"]));
            }
        } catch (err: any) {
            return serverErrorHandler(err, res, err.message, HttpCodeEnum.SERVERERROR, {});
        }
    }
    public async add(req: Request, res: Response): Promise<any> {
        try {
            const fn = "[add]";
            // Set locale
            const { locale } = req.query;
            this.locale = (locale as string) || "en";

            const { name } = req.body;

            const result: any = await Watchlist.create({
                name: name,
                status: true,
                created_by: req.customer.object_id
            });

            if (result) {
                return serverResponse(res, HttpCodeEnum.OK, ServerMessages.errorMsgLocale(this.locale, ServerMessagesEnum["watchlist-add"]), {});
            } else {
                throw new Error(ServerMessages.errorMsgLocale(this.locale, ServerMessagesEnum["server-error"]));
            }
        } catch (err: any) {
            console.error(err);
            return serverErrorHandler(err, res, err.message, HttpCodeEnum.SERVERERROR, {});
        }
    }

    public async update(req: Request, res: Response): Promise<any> {
        try {
            const fn = "[update]";
            // Set locale
            const { locale } = req.query;
            this.locale = (locale as string) || "en";

            const { id } = req.params; // Assuming the ID is passed as a URL parameter
            const { name } = req.body;
            let result: any = await Watchlist.findOneAndUpdate(
                { id: id },
                {
                    name: name,
                    updated_by: req.customer.object_id
                });
            // const watchlist = await Watchlist.find({ id });

            // watchlist[0].name = name;
            // await watchlist[0].save();

            return serverResponse(res, HttpCodeEnum.OK, ServerMessages.errorMsgLocale(this.locale, ServerMessagesEnum["watchlist-update"]), {});
        } catch (err: any) {
            console.error(err);
            return serverErrorHandler(err, res, err.message, HttpCodeEnum.SERVERERROR, {});
        }
    }

    public async delete(req: Request, res: Response): Promise<any> {
        try {
            const fn = "[delete]";
            // Set locale
            const { locale } = req.query;
            this.locale = (locale as string) || "en";

            // Log the id for debugging purposes

            const id = parseInt(req.params.id);
            const wishlist:any = await Watchlist.findOne({ id: id }).lean();
            const watchItem = await WatchlistItem.deleteMany({ watchlist_id: wishlist._id });
            
            const result = await Watchlist.deleteOne({ id: id });


            if (result) {
                return serverResponse(res, HttpCodeEnum.OK, ServerMessages.errorMsgLocale(this.locale, ServerMessagesEnum["watchlist-delete"]), result);
            } else {
                throw new Error(ServerMessages.errorMsgLocale(this.locale, ServerMessagesEnum["not-found"]));
            }

        } catch (err: any) {
            return serverErrorHandler(err, res, err.message, HttpCodeEnum.SERVERERROR, {});
        }
    }


    // Checked
    public async getProductsByWatchlistId(req: Request, res: Response): Promise<any> {
        try {
            const fn = "[getById]";
            // Set locale
            const { locale } = req.query;
            this.locale = (locale as string) || "en";

            const id = parseInt(req.params.id);
            const watchlist: any = await Watchlist.findOne({ id: id }).lean();
            const result: any = await WatchlistItem.find({ watchlist_id: watchlist._id }).populate({
                path: 'product_id',
                transform: (doc) => {
                    if (doc && doc.product_image) {
                        doc.product_image = `${process.env.RESOURCE_URL}${doc.product_image}`;
                    }
                    return doc;
                }
            }).sort({ _id: -1 }).lean();


            if (result) {
                return serverResponse(res, HttpCodeEnum.OK, ServerMessages.errorMsgLocale(this.locale, ServerMessagesEnum["watchlist-fetched"]), result);
            } else {
                throw new Error(ServerMessages.errorMsgLocale(this.locale, ServerMessagesEnum["not-found"]));
            }
        } catch (err: any) {
            return serverErrorHandler(err, res, err.message, HttpCodeEnum.SERVERERROR, {});
        }
    }
}