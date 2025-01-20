import { Request, Response } from "express";
import { ValidationChain } from "express-validator";
import moment from "moment";
import { Offers,Product,Rating,UnlockOffers,Transaction, Wallet } from "../../../models";
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

            const { target_price, buy_quantity,brand,coo,pin_code, product_location, product_id,individual_pack,master_pack,selling_unit,conversion_unit,conversion_rate,offer_validity,city,state} = req.body;

            let result: any;
            const product:any = await Product.findOne({ id: product_id }).lean();
            result = await Offers.create({
                target_price: target_price,
                buy_quantity: buy_quantity,
                brand: brand,
                coo: coo,
                pin_code: pin_code,
                individual_pack: individual_pack,
                master_pack: master_pack,
                selling_unit: selling_unit,
                conversion_unit: conversion_unit,
                conversion_rate: conversion_rate,
                product_location: product_location,
                offer_validity:offer_validity,
                publish_date:moment().format('YYYY-MM-DD HH:mm:ss'),
                state:state,
                city:city,
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

            const { offer_price, moq, brand,coo,pin_code,product_location, product_id,individual_pack,master_pack,selling_unit,conversion_unit,conversion_rate,offer_validity,city,state} = req.body;

            let result: any;
            const product:any = await Product.findOne({ id: product_id }).lean();
            result = await Offers.create({
                offer_price: offer_price,
                moq: moq,
                brand: brand,
                coo: coo,
                pin_code: pin_code,
                product_location: product_location,
                individual_pack: individual_pack,
                master_pack: master_pack,
                selling_unit: selling_unit,
                conversion_unit: conversion_unit,
                conversion_rate: conversion_rate,
                offer_validity:offer_validity,
                publish_date:moment().format('YYYY-MM-DD HH:mm:ss'),
                state:state,
                city:city,
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

    // Status
    public async activateOffers(req: Request, res: Response): Promise<any> {
        try {
            const fn = "[status]";
            // Set locale
            const { locale } = req.query;
            this.locale = (locale as string) || "en";

            const id = parseInt(req.params.id);
            const { offer_ids,offer_validity } = req.body;
            // const updationstatus = await Offers.findOneAndUpdate({ id:offer_ids }, { offer_validity: offer_validity,publish_date:moment().format('YYYY-MM-DD HH:mm:ss'),status:1 }).lean();
            const updationstatus = await Offers.updateMany(
                { id: { $in: offer_ids } },  // Match any document with id in the offer_ids array
                {
                  offer_validity: offer_validity,
                  publish_date: moment().format('YYYY-MM-DD HH:mm:ss'),
                  status: 1
                }
              );
            // const updatedData: any = await Offers.find({ id: id }).lean();
            if (updationstatus) {
                return serverResponse(res, HttpCodeEnum.OK, ServerMessages.errorMsgLocale(this.locale, ServerMessagesEnum["offer-status"]), {});
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


    // Checked
    public async getUnlockedOffersList(req: Request, res: Response): Promise<any> {
        try {
            const fn = "[getUnlockedOffersList]";
            // Set locale
            const { locale, page, limit, search,offerType,status } = req.query;
            this.locale = (locale as string) || "en";

            const pageNumber = parseInt(page as string) || 1;
            const limitNumber = parseInt(limit as string) || 10;
            const skip = (pageNumber - 1) * limitNumber;
            // Create filter object for status and offerType
            let filter: any = { created_by: req.customer.object_id };

            
            const results = await UnlockOffers.find(filter)
                .sort({ _id: -1 }) // Sort by _id in descending order
                .skip(skip)
                .limit(limitNumber)
                .lean()
                .populate("offer_id")
                .populate("transaction_id")
                .populate({
                    path: 'offer_id',
                    populate: [
                        {
                            path: 'ratings', // Use the virtual "ratings" field
                            match: { created_by: req.customer.object_id }, // Filter by the user who created the rating
                            select: 'id rating rating_comment', // Select only the required fields
                            model: 'Rating', // Reference the Rating model
                        },
                        {
                            path: 'product_id', // Populate the product_id field as well
                            model: 'products', // Reference the Product model
                        },
                        {
                            path: 'created_by', // Populate the product_id field as well
                            model: 'customers', // Reference the Product model
                        }
                    ],
                    
                  });

            const totalCount = await UnlockOffers.countDocuments(filter);
            const totalPages = Math.ceil(totalCount / limitNumber);

            if (results.length > 0) {
                
                return serverResponse(res, HttpCodeEnum.OK, ServerMessages.errorMsgLocale(this.locale, ServerMessagesEnum["unlocked-offers-fetched"]), { data: results, totalCount, totalPages, currentPage: pageNumber });
            } else {
                throw new Error(ServerMessages.errorMsgLocale(this.locale, ServerMessagesEnum["not-found"]));
            }
        } catch (err: any) {
            return serverErrorHandler(err, res, err.message, HttpCodeEnum.SERVERERROR, {});
        }
    }

    //add
    public async unlockOffer(req: Request, res: Response): Promise<any> {
        try {
            const fn = "[unlockOffer]";
            const { locale } = req.query;
            this.locale = (locale as string) || "en";

            const { offer_id,price,amount,gst} = req.body;

            let result: any;
            const offer:any = await Offers.findOne({ id: offer_id }).lean();

            const transaction: any = await Transaction.create({
                amount: amount,
                gst: gst,
                price: price,
                transaction_type: 1,
                transaction_id: null,
                status: 1,
                customer_id: req.customer.object_id
            });
            console.log(transaction);
            result = await UnlockOffers.create({
                transaction_id:transaction._id,
                price: price,
                offer_id: offer._id,
                status: 1,
                created_by:req.customer.object_id
            });
            const walletBalance:any = await Wallet.findOne({customer_id:req.customer.object_id}).lean();
            console.log(walletBalance);
            const resultwallet: any = await Wallet.findOneAndUpdate(
                { customer_id: req.customer.object_id },
                {
                    balance: walletBalance.balance - parseInt(price),
                });
            

            return serverResponse(res, HttpCodeEnum.OK, constructResponseMsg(this.locale, "offer-unlocked"), {});
        } catch (err: any) {
            return serverErrorHandler(err, res, err.message, HttpCodeEnum.SERVERERROR, {});
        }
    }

    // Checked
    public async getUnlockedOfferById(req: Request, res: Response): Promise<any> {
        try {
            const fn = "[getUnlockedOfferById]";
            // Set locale
            const { locale } = req.query;
            this.locale = (locale as string) || "en";

            const id = parseInt(req.params.id);
            const result: any = await UnlockOffers.findOne({ id: id }).lean().populate("offer_id")
            .populate("transaction_id")
            .populate({
                path: 'offer_id',
                populate: [
                    {
                        path: 'ratings', // Use the virtual "ratings" field
                        match: { created_by: req.customer.object_id }, // Filter by the user who created the rating
                        select: 'id rating rating_comment', // Select only the required fields
                        model: 'Rating', // Reference the Rating model
                    },
                    {
                        path: 'product_id', // Populate the product_id field as well
                        model: 'products', // Reference the Product model
                    },
                    {
                        path: 'created_by', // Populate the product_id field as well
                        model: 'customers', // Reference the Product model
                    }
                ],
                
              });


            if (result) {
                return serverResponse(res, HttpCodeEnum.OK, ServerMessages.errorMsgLocale(this.locale, ServerMessagesEnum["unlocked-offers-fetched"]), result);
            } else {
                throw new Error(ServerMessages.errorMsgLocale(this.locale, ServerMessagesEnum["not-found"]));
            }
        } catch (err: any) {
            return serverErrorHandler(err, res, err.message, HttpCodeEnum.SERVERERROR, {});
        }
    }

    // Checked
    public async getOfferRatingById(req: Request, res: Response): Promise<any> {
        try {
            const fn = "[getById]";
            // Set locale
            const { locale } = req.query;
            this.locale = (locale as string) || "en";

            const id = parseInt(req.params.id);
            const result: any = await Rating.findOne({ id: id }).lean().populate("offer_id","id name");


            if (result) {
                return serverResponse(res, HttpCodeEnum.OK, ServerMessages.errorMsgLocale(this.locale, ServerMessagesEnum["rating-fetched"]), result);
            } else {
                throw new Error(ServerMessages.errorMsgLocale(this.locale, ServerMessagesEnum["not-found"]));
            }
        } catch (err: any) {
            return serverErrorHandler(err, res, err.message, HttpCodeEnum.SERVERERROR, {});
        }
    }

    //add
    public async addRating(req: Request, res: Response): Promise<any> {
        try {
            const fn = "[postBuyOffer]";
            const { locale } = req.query;
            this.locale = (locale as string) || "en";

            const { offer_id,rating, rating_comment} = req.body;

            let result: any;
            const offer:any = await Offers.findOne({ id: offer_id }).lean();
            result = await Rating.create({
                rating: rating,
                rating_comment: rating_comment,
                offer_id: offer._id,
                customer_id:offer.created_by,
                status: 1,
                created_by:req.customer.object_id
            });


            return serverResponse(res, HttpCodeEnum.OK, constructResponseMsg(this.locale, "rating-submitted"), {});
        } catch (err: any) {
            return serverErrorHandler(err, res, err.message, HttpCodeEnum.SERVERERROR, {});
        }
    }

    //add
    public async updateRating(req: Request, res: Response): Promise<any> {
        try {
            const fn = "[updateRating]";
            const { locale } = req.query;
            this.locale = (locale as string) || "en";

            const { rating, rating_comment} = req.body;
            const id = parseInt(req.params.id);
            let result: any;
            result = await Rating.findOneAndUpdate(
                { id: id },
                {
                    rating: rating,
                    rating_comment: rating_comment,
                    updated_by: req.customer.object_id
                });
            


            return serverResponse(res, HttpCodeEnum.OK, constructResponseMsg(this.locale, "rating-updated"), result);
        } catch (err: any) {
            return serverErrorHandler(err, res, err.message, HttpCodeEnum.SERVERERROR, {});
        }
    }
} 

