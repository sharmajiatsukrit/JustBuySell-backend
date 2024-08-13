import { Request, Response } from "express";
import { ValidationChain } from "express-validator";
import moment from "moment";
import { Customer, ProductRequest, Watchlist, WatchlistItem, Product } from "../../../models";
import { removeObjectKeys, serverResponse, serverErrorHandler, removeSpace, constructResponseMsg, serverInvalidRequest, groupByDate } from "../../../utils";
import { HttpCodeEnum } from "../../../enums/server";
import validate from "./validate";
import EmailService from "../../../utils/email";
import Logger from "../../../utils/logger";
import ServerMessages, { ServerMessagesEnum } from "../../../config/messages";


const fileName = "[user][helper][index.ts]";
export default class HelperController {
    public locale: string = "en";
    public emailService;

    constructor() {
        this.emailService = new EmailService();
    }

    public validate(endPoint: string): ValidationChain[] {
        return validate(endPoint);
    }


    // Checked
    public async getMyProfile(req: Request, res: Response): Promise<any> {
        try {
            const fn = "[getById]";
            // Set locale
            const { locale } = req.query;
            this.locale = (locale as string) || "en";

            const results: any = await Customer.findOne({ _id: req.customer.object_id }).lean();
            if (results.company_logo.length) {

            }
            if (results) {
                return serverResponse(res, HttpCodeEnum.OK, ServerMessages.errorMsgLocale(this.locale, ServerMessagesEnum["customer-fetched"]), results);
            } else {
                throw new Error(ServerMessages.errorMsgLocale(this.locale, ServerMessagesEnum["not-found"]));
            }
        } catch (err: any) {
            return serverErrorHandler(err, res, err.message, HttpCodeEnum.SERVERERROR, {});
        }
    }

    public async requestNewProduct(req: Request, res: Response): Promise<any> {
        try {
            const fn = "[requestNewProduct]";

            // Set locale
            const { locale } = req.query;
            this.locale = (locale as string) || "en";
            const { name, selling_unit, individual_pack_size, individual_pack_unit, Individual_packing_type, master_pack_qty, master_pack_type, description } = req.body;
            let product_image: any;
            if (req.file) {
                product_image = req?.file?.filename;
            } else {
                return serverResponse(res, HttpCodeEnum.OK, "No Product Image Attached", {});
            }

            const result: any = await ProductRequest.create({
                name: name,
                selling_unit: selling_unit,
                individual_pack_size: individual_pack_size,
                individual_pack_unit: individual_pack_unit,
                Individual_packing_type: Individual_packing_type,
                master_pack_qty: master_pack_qty,
                master_pack_type: master_pack_type,
                description: description,
                product_image: product_image,
                created_by: req.customer.object_id
            });

            if (result) {
                return serverResponse(res, HttpCodeEnum.OK, ServerMessages.errorMsgLocale(this.locale, ServerMessagesEnum["product-requested"]), {});
            } else {
                throw new Error(ServerMessages.errorMsgLocale(this.locale, ServerMessagesEnum["server-error"]));
            }
        } catch (err: any) {
            return serverErrorHandler(err, res, err.message, HttpCodeEnum.SERVERERROR, {});
        }
    }

    public async addToWatchlist(req: Request, res: Response): Promise<any> {
        try {
            const fn = "[requestNewProduct]";

            // Set locale
            const { locale } = req.query;
            this.locale = (locale as string) || "en";
            const { watchlist_id, product_id } = req.body;

            const watchlist: any = Watchlist.findOne({ id: watchlist_id }).lean();
            const product: any = Product.findOne({ id: product_id }).lean();

            const result: any = await WatchlistItem.create({
                product_id: product._id,
                watchlist_id: watchlist._id,
                customer_id: req.customer.object_id
            });

            if (result) {
                return serverResponse(res, HttpCodeEnum.OK, ServerMessages.errorMsgLocale(this.locale, ServerMessagesEnum["watchlist-item-add"]), {});
            } else {
                throw new Error(ServerMessages.errorMsgLocale(this.locale, ServerMessagesEnum["server-error"]));
            }
        } catch (err: any) {
            return serverErrorHandler(err, res, err.message, HttpCodeEnum.SERVERERROR, {});
        }
    }

    public async removeFromWatchlist(req: Request, res: Response): Promise<any> {
        try {
            const fn = "[requestNewProduct]";

            // Set locale
            const { locale } = req.query;
            this.locale = (locale as string) || "en";
            const { watchlist_id, product_id } = req.body;

            const watchlist: any = Watchlist.findOne({ id: watchlist_id }).lean();
            const product: any = Product.findOne({ id: product_id }).lean();


            const result = await WatchlistItem.deleteOne({
                product_id: product._id,
                watchlist_id: watchlist._id,
                customer_id: req.customer.object_id
            });

            if (result) {
                return serverResponse(res, HttpCodeEnum.OK, ServerMessages.errorMsgLocale(this.locale, ServerMessagesEnum["watchlist-item-remove"]), {});
            } else {
                throw new Error(ServerMessages.errorMsgLocale(this.locale, ServerMessagesEnum["server-error"]));
            }
        } catch (err: any) {
            return serverErrorHandler(err, res, err.message, HttpCodeEnum.SERVERERROR, {});
        }
    }
}