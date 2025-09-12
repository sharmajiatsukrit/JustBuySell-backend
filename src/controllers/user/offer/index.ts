import { Request, Response } from "express";
import { ValidationChain } from "express-validator";
// import moment from "moment";
import { Offers, Product, Rating, UnlockOffers, Transaction, Wallet, Customer } from "../../../models";
import { removeObjectKeys, serverResponse, serverErrorHandler, removeSpace, constructResponseMsg, serverInvalidRequest, groupByDate } from "../../../utils";
import { HttpCodeEnum } from "../../../enums/server";
import validate from "./validate";
import EmailService from "../../../utils/email";
import Logger from "../../../utils/logger";
import ServerMessages, { ServerMessagesEnum } from "../../../config/messages";
import moment from "moment-timezone";
import { prepareNotificationData } from "../../../utils/notification-center";
moment.tz.setDefault("Asia/Kolkata");
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

            const { target_price, buy_quantity, brand, coo, pin_code, product_location, product_id, individual_pack, master_pack, offer_validity, city, state, offer_price, moq } = req.body;

            let result: any;
            const product: any = await Product.findOne({ id: product_id }).lean();
            result = await Offers.create({
                target_price: target_price,
                buy_quantity: buy_quantity,
                brand: brand,
                coo: coo,
                pin_code: pin_code,
                individual_pack: individual_pack,
                master_pack: master_pack,
                product_location: product_location,
                offer_validity: offer_validity,
                publish_date: moment().format("YYYY-MM-DD HH:mm:ss"),
                state: state,
                city: city,
                product_id: product._id,
                offer_price: offer_price,
                moq: moq,
                type: 0, //buy
                status: 1,
                created_by: req.customer.object_id,
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

            const { target_price, buy_quantity, brand, coo, pin_code, product_location, product_id, individual_pack, master_pack, offer_validity, city, state, offer_price, moq } = req.body;

            let result: any;
            const product: any = await Product.findOne({ id: product_id }).lean();
            result = await Offers.create({
                target_price: target_price,
                buy_quantity: buy_quantity,
                brand: brand,
                coo: coo,
                pin_code: pin_code,
                individual_pack: individual_pack,
                master_pack: master_pack,
                product_location: product_location,
                offer_validity: offer_validity,
                publish_date: moment().format("YYYY-MM-DD HH:mm:ss"),
                state: state,
                city: city,
                product_id: product._id,
                offer_price: offer_price,
                moq: moq,
                type: 1, //sell
                status: 1,
                created_by: req.customer.object_id,
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
            const { locale, page, limit, search, offerType, status } = req.query;
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
                .lean()
                .populate("product_id", "id name");

            const totalCount = await Offers.countDocuments(filter);
            const totalPages = Math.ceil(totalCount / limitNumber);

            if (results.length > 0) {
                return serverResponse(res, HttpCodeEnum.OK, ServerMessages.errorMsgLocale(this.locale, ServerMessagesEnum["offer-fetched"]), {
                    data: results,
                    totalCount,
                    totalPages,
                    currentPage: pageNumber,
                });
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
            const result: any = await Offers.findOne({ id: id }).lean().populate("product_id", "id name");

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
                    updated_by: req.customer.object_id,
                }
            );
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
            const { offer_ids, offer_validity } = req.body;
            // const updationstatus = await Offers.findOneAndUpdate({ id:offer_ids }, { offer_validity: offer_validity,publish_date:moment().format('YYYY-MM-DD HH:mm:ss'),status:1 }).lean();
            const updationstatus = await Offers.updateMany(
                { id: { $in: offer_ids } }, // Match any document with id in the offer_ids array
                {
                    $set: {
                        offer_validity: offer_validity,
                        publish_date: moment().format("YYYY-MM-DD HH:mm:ss"),
                        status: 1,
                    },
                    $inc: {
                        offer_counter: 1,
                    },
                }
            );
            // const updationstatus = await Offers.updateMany(
            //     { id: { $in: offer_ids } },  // Match any document with id in the offer_ids array
            //     {
            //       offer_validity: offer_validity,
            //       offer_counter:1,
            //       publish_date: moment().format('YYYY-MM-DD HH:mm:ss'),
            //       status: 1
            //     }
            //   );
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

            const { target_price, buy_quantity, brand, coo, pin_code, product_location, product_id, individual_pack, master_pack, offer_validity, city, state } = req.body;
            const id = parseInt(req.params.id);
            let result: any;
            const product: any = await Product.findOne({ id: product_id }).lean();

            result = await Offers.findOneAndUpdate(
                { id: id },
                {
                    target_price: target_price,
                    buy_quantity: buy_quantity,
                    brand: brand,
                    coo: coo,
                    pin_code: pin_code,
                    individual_pack: individual_pack,
                    master_pack: master_pack,
                    product_location: product_location,
                    offer_validity: offer_validity,
                    publish_date: moment().format("YYYY-MM-DD HH:mm:ss"),
                    state: state,
                    city: city,
                    product_id: product._id,
                    type: 0, //buy
                    status: 1,
                    updated_by: req.customer.object_id,
                }
            );

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

            const { offer_price,target_price, buy_quantity, moq, brand, coo, pin_code, product_location, product_id, individual_pack, master_pack, offer_validity, city, state } = req.body;
            const id = parseInt(req.params.id);
            let result: any;
            const product: any = await Product.findOne({ id: product_id }).lean();
            result = await Offers.findOneAndUpdate(
                { id: id },
                {
                    brand: brand,
                    coo: coo,
                    pin_code: pin_code,
                    individual_pack: individual_pack,
                    master_pack: master_pack,
                    product_location: product_location,
                    offer_validity: offer_validity,
                    publish_date: moment().format("YYYY-MM-DD HH:mm:ss"),
                    state: state,
                    city: city,
                    product_id: product._id,
                    offer_price: offer_price,
                    moq: moq,
                    type: 1, //sell
                    status: 1,
                    updated_by: req.customer.object_id,
                }
            );

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
            const { locale, page, limit, search, offerType, status } = req.query;
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
                    path: "offer_id",
                    populate: [
                        {
                            path: "ratings", // Use the virtual "ratings" field
                            match: { created_by: req.customer.object_id }, // Filter by the user who created the rating
                            select: "id rating rating_comment", // Select only the required fields
                            model: "Rating", // Reference the Rating model
                        },
                        {
                            path: "product_id", // Populate the product_id field as well
                            model: "products", // Reference the Product model
                        },
                        {
                            path: "created_by", // Populate the product_id field as well
                            model: "customers", // Reference the Product model
                        },
                    ],
                });

            const totalCount = await UnlockOffers.countDocuments(filter);
            const totalPages = Math.ceil(totalCount / limitNumber);

            if (results.length > 0) {
                const formattedResult = await Promise.all(
                    results.map(async (offer: any) => {
                        // Fetch the rating count for each offer
                        const ratingCount = await Rating.countDocuments({ offer_id: offer._id });

                        // Return the offer object along with the additional `rating_count` field
                        return {
                            ...offer, // Spread all existing offer fields
                            rating_count: ratingCount, // Add the rating_count field
                        };
                    })
                );
                return serverResponse(res, HttpCodeEnum.OK, ServerMessages.errorMsgLocale(this.locale, ServerMessagesEnum["unlocked-offers-fetched"]), {
                    data: formattedResult,
                    totalCount,
                    totalPages,
                    currentPage: pageNumber,
                });
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

            const { offer_id, commission, amount, gst, sgst, cgst, igst, particular, offer_price, discount } = req.body;
            let result: any;
            const offer: any = await Offers.findOne({ id: offer_id }).lean();
            const sellerData: any = await Customer.findOne({ _id: offer?.created_by });
            const buyerData: any = await Customer.findOne({ _id: req.customer.object_id });
            
            const transaction: any = await Transaction.create({
                amount, // => total money charged (gst+commission eg. in simple term total credit/debit from wallet)
                gst,
                sgst,
                cgst,
                igst,
                commission,
                transaction_type: 1,
                particular,
                offer_price,
                discount,
                transaction_id: null,
                status: 1,
                remarks: "PURCHASEOFFER",
                customer_id: req.customer.object_id,
            });
            result = await UnlockOffers.create({
                transaction_id: transaction._id,
                price: amount,
                commision:commission,
                offer_id: offer._id,
                offer_counter: offer.offer_counter,
                status: 1,
                created_by: req.customer.object_id,
            });

            const customerId = req.customer.object_id;
            const defaultAmountToDeduct = Number(amount);
            const promoAmountToDeduct = Number(discount);

            // Update Wallet Type 0 default wallet
            const wallet0: any = await Wallet.findOne({ customer_id: customerId, type: 0 }).lean();
            if (wallet0) {
                await Wallet.findOneAndUpdate(
                    { customer_id: customerId, type: 0 },
                    {
                        balance: Math.max(0, wallet0.balance - defaultAmountToDeduct),
                    }
                );
            }

            // Update Wallet Type 1 promo wallet
            const wallet1: any = await Wallet.findOne({ customer_id: customerId, type: 1 }).lean();
            if (wallet1) {
                await Wallet.findOneAndUpdate(
                    { customer_id: customerId, type: 1 },
                    {
                        balance: Math.max(0, wallet1.balance - promoAmountToDeduct),
                    }
                );
            }

            if (offer.type == 0) {
                prepareNotificationData({sellerData:sellerData,buyerData:buyerData,tmplt_name:"seller_opened_buyer_offer"})
                const expirebuyoffer: any = await Offers.findOneAndUpdate({ id: offer_id }, { status: 0 });

            }if(offer.type == 1){
                prepareNotificationData({sellerData:buyerData,buyerData:sellerData,tmplt_name:"buyer_opened_seller_offer"})
            }

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
            const result: any = await UnlockOffers.findOne({ id: id })
                .lean()
                .populate("offer_id")
                .populate("transaction_id")
                .populate({
                    path: "offer_id",
                    populate: [
                        {
                            path: "ratings", // Use the virtual "ratings" field
                            match: { created_by: req.customer.object_id }, // Filter by the user who created the rating
                            select: "id rating rating_comment", // Select only the required fields
                            model: "Rating", // Reference the Rating model
                        },
                        {
                            path: "product_id", // Populate the product_id field as well
                            model: "products", // Reference the Product model
                        },
                        {
                            path: "created_by", // Populate the product_id field as well
                            model: "customers", // Reference the Product model
                        },
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
            const result: any = await Rating.findOne({ id: id }).lean().populate("offer_id", "id name");

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

            const { offer_id, rating, rating_comment } = req.body;

            let result: any;
            const offer: any = await Offers.findOne({ id: offer_id }).lean();
            result = await Rating.create({
                rating: rating,
                rating_comment: rating_comment,
                offer_id: offer._id,
                customer_id: offer.created_by,
                status: 1,
                created_by: req.customer.object_id,
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

            const { rating, rating_comment } = req.body;
            const id = parseInt(req.params.id);
            let result: any;
            result = await Rating.findOneAndUpdate(
                { id: id },
                {
                    rating: rating,
                    rating_comment: rating_comment,
                    updated_by: req.customer.object_id,
                }
            );

            return serverResponse(res, HttpCodeEnum.OK, constructResponseMsg(this.locale, "rating-updated"), result);
        } catch (err: any) {
            return serverErrorHandler(err, res, err.message, HttpCodeEnum.SERVERERROR, {});
        }
    }
}
