import { Request, Response } from "express";
import { ValidationChain } from "express-validator";
import moment from "moment";
import { Offers,Product,Category } from "../../../models";
import { removeObjectKeys, serverResponse, serverErrorHandler, removeSpace, constructResponseMsg, serverInvalidRequest, groupByDate } from "../../../utils";
import { HttpCodeEnum } from "../../../enums/server";
import validate from "./validate";
import EmailService from "../../../utils/email";
import Logger from "../../../utils/logger";
import ServerMessages, { ServerMessagesEnum } from "../../../config/messages";

const fileName = "[admin][productrequest][index.ts]";
export default class OfferController {
    public locale: string = "en";
    public emailService;

    constructor() {
        this.emailService = new EmailService();
    }

    public validate(endPoint: string): ValidationChain[] {
        return validate(endPoint);
    }

    //add
    public async postBuyOffer(req: Request, res: Response): Promise<any> {
        try {
            const fn = "[postBuyOffer]";
            const { locale } = req.query;
            this.locale = (locale as string) || "en";

            const { target_price, buy_quantity, product_location, product_id} = req.body;

            let result: any;
            const product:any = await Product.findOne({ id: product_id }).lean();
            result = await Offers.create({
                target_price: target_price,
                buy_quantity: buy_quantity,
                product_location: product_location,
                product_id: product._id,
                type: 0,//buy
                status: 1,
                created_by:req.customer.object_id
            });


            return serverResponse(res, HttpCodeEnum.OK, constructResponseMsg(this.locale, "offer-add"), result.doc);
        } catch (err: any) {
            return serverErrorHandler(err, res, err.message, HttpCodeEnum.SERVERERROR, {});
        }
    }

    //add
    public async postSellOffer(req: Request, res: Response): Promise<any> {
        try {
            const fn = "[postSellOffer]";
            const { locale } = req.query;
            this.locale = (locale as string) || "en";

            const { offer_price, moq, brand,coo,product_location, product_id} = req.body;

            let result: any;
            const product:any = await Product.findOne({ id: product_id }).lean();
            result = await Offers.create({
                offer_price: offer_price,
                moq: moq,
                brand: brand,
                coo: coo,
                product_location: product_location,
                product_id: product._id,
                type: 1,//sell
                status: 1,
                created_by:req.customer.object_id
            });


            return serverResponse(res, HttpCodeEnum.OK, constructResponseMsg(this.locale, "offer-add"), result.doc);
        } catch (err: any) {
            return serverErrorHandler(err, res, err.message, HttpCodeEnum.SERVERERROR, {});
        }
    }

    // Checked
    public async getList(req: Request, res: Response): Promise<any> {
        try {
            const fn = "[getList]";
            // Set locale
            const { locale, page, limit, search,offerType,status } = req.query;
            this.locale = (locale as string) || "en";

            const pageNumber = parseInt(page as string) || 1;
            const limitNumber = parseInt(limit as string) || 10;
            const skip = (pageNumber - 1) * limitNumber;
            // Create filter object for status and offerType
            let filter: any = { created_by: req.customer.object_id };

            if (status) {
                filter.status = parseInt(status as string); // Ensure status is numeric
            }

            if (offerType) {
                filter.type = offerType; // Assuming offerType is a string, adjust as needed
            }
            const results = await Offers.find(filter)
                .sort({ _id: -1 }) // Sort by _id in descending order
                .skip(skip)
                .limit(limitNumber)
                .lean().populate("product_id","id name");

            const totalCount = await Offers.countDocuments(filter);
            const totalPages = Math.ceil(totalCount / limitNumber);

            if (results.length > 0) {
                return serverResponse(res, HttpCodeEnum.OK, ServerMessages.errorMsgLocale(this.locale, ServerMessagesEnum["offer-fetched"]), { data: results, totalCount, totalPages, currentPage: pageNumber });
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
            const result: any = await Offers.findOne({ id: id }).lean().populate("product_id","id name");


            if (result) {
                return serverResponse(res, HttpCodeEnum.OK, ServerMessages.errorMsgLocale(this.locale, ServerMessagesEnum["watchlist-fetched"]), result);
            } else {
                throw new Error(ServerMessages.errorMsgLocale(this.locale, ServerMessagesEnum["not-found"]));
            }
        } catch (err: any) {
            return serverErrorHandler(err, res, err.message, HttpCodeEnum.SERVERERROR, {});
        }
    }

    public async update(req: Request, res: Response): Promise<any> {
        try {
            const fn = "[update]";
            // Set locale
            const { locale } = req.query;
            this.locale = (locale as string) || "en";

            const id = parseInt(req.params.id);
            const { name } = req.body;
            let result: any = await Offers.findOneAndUpdate(
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
            const result = await Offers.deleteOne({ id: id });

            if (result) {
                return serverResponse(res, HttpCodeEnum.OK, ServerMessages.errorMsgLocale(this.locale, ServerMessagesEnum["offer-delete"]), result);
            } else {
                throw new Error(ServerMessages.errorMsgLocale(this.locale, ServerMessagesEnum["not-found"]));
            }

        } catch (err: any) {
            return serverErrorHandler(err, res, err.message, HttpCodeEnum.SERVERERROR, {});
        }
    }

       // Status
    public async status(req: Request, res: Response): Promise<any> {
        try {
            const fn = "[status]";
            // Set locale
            const { locale } = req.query;
            this.locale = (locale as string) || "en";

            const id = parseInt(req.params.id);
            const { status } = req.body;
            const updationstatus = await Offers.findOneAndUpdate({ id: id }, { status: status }).lean();
            const updatedData: any = await Offers.find({ id: id }).lean();
            if (updationstatus) {
                return serverResponse(res, HttpCodeEnum.OK, ServerMessages.errorMsgLocale(this.locale, ServerMessagesEnum["offer-status"]), updatedData);
            } else {
                throw new Error(ServerMessages.errorMsgLocale(this.locale, ServerMessagesEnum["not-found"]));
            }
        } catch (err: any) {
            return serverErrorHandler(err, res, err.message, HttpCodeEnum.SERVERERROR, {});
        }
    }

    //add
    public async updateBuyOffer(req: Request, res: Response): Promise<any> {
        try {
            const fn = "[updateBuyOffer]";
            const { locale } = req.query;
            this.locale = (locale as string) || "en";

            const { target_price, buy_quantity, product_location, product_id} = req.body;
            const id = parseInt(req.params.id);
            let result: any;
            const product:any = await Product.findOne({ id: product_id }).lean();

            result = await Offers.findOneAndUpdate(
                { id: id },
                {
                    target_price: target_price,
                    buy_quantity: buy_quantity,
                    product_location: product_location,
                    product_id: product._id,
                    type: 0,//buy
                    status: 1,
                    updated_by: req.customer.object_id
                });
            


            return serverResponse(res, HttpCodeEnum.OK, constructResponseMsg(this.locale, "offer-add"), result.doc);
        } catch (err: any) {
            return serverErrorHandler(err, res, err.message, HttpCodeEnum.SERVERERROR, {});
        }
    }

    //add
    public async updateSellOffer(req: Request, res: Response): Promise<any> {
        try {
            const fn = "[updateSellOffer]";
            const { locale } = req.query;
            this.locale = (locale as string) || "en";

            const { offer_price, moq, brand,coo,product_location, product_id} = req.body;
            const id = parseInt(req.params.id);
            let result: any;
            const product:any = await Product.findOne({ id: product_id }).lean();
            result = await Offers.findOneAndUpdate(
                { id: id },
                {
                    offer_price: offer_price,
                    moq: moq,
                    brand: brand,
                    coo: coo,
                    product_location: product_location,
                    product_id: product._id,
                    type: 1,//sell
                    status: 1,
                    updated_by: req.customer.object_id
                });
            


            return serverResponse(res, HttpCodeEnum.OK, constructResponseMsg(this.locale, "offer-add"), result.doc);
        } catch (err: any) {
            return serverErrorHandler(err, res, err.message, HttpCodeEnum.SERVERERROR, {});
        }
    }
} 

