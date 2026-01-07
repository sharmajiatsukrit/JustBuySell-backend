import { Request, Response } from "express";
import { ValidationChain } from "express-validator";
// import moment from "moment";
import { Offers, Product, Rating, UnlockOffers, Transaction, Wallet, Customer, Category } from "../../../models";
import { removeObjectKeys, serverResponse, serverErrorHandler, removeSpace, constructResponseMsg, serverInvalidRequest, groupByDate, triggerNotifications } from "../../../utils";
import { HttpCodeEnum } from "../../../enums/server";
import validate from "./validate";
import EmailService from "../../../utils/email";
import Logger from "../../../utils/logger";
import ServerMessages, { ServerMessagesEnum } from "../../../config/messages";
import moment from "moment-timezone";
import { prepareNotificationData, prepareWhatsAppNotificationData } from "../../../utils/notification-center";
import GeoLoactionService from "../../../utils/get-location";
import PromoTransaction from "../../../models/promo-transaction";
const geoLoaction = new GeoLoactionService();
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

            const { target_price, buy_quantity, brand, coo, pin_code, product_location, product_id, individual_pack, master_pack, offer_validity, city, state, offer_price, moq } =
                req.body;

            let result: any;
            const locationResponse: any = await geoLoaction.getGeoLoaction(pin_code);

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
                type: 0,
                status: 1,
                location: {
                    type: "Point",
                    coordinates: [locationResponse?.geometry?.location?.lng, locationResponse?.geometry?.location?.lat], // [longitude, latitude]
                },
                created_by: req.customer.object_id,
            });

            return serverResponse(res, HttpCodeEnum.OK, constructResponseMsg(this.locale, "offer-add"), {});
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

            const { target_price, buy_quantity, brand, coo, pin_code, product_location, product_id, individual_pack, master_pack, offer_validity, city, state, offer_price, moq } =
                req.body;

            let result: any;
            const locationResponse: any = await geoLoaction.getGeoLoaction(pin_code);

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
                type: 1,
                status: 1,
                location: {
                    type: "Point",
                    coordinates: [locationResponse?.geometry?.location?.lng, locationResponse?.geometry?.location?.lat], // [longitude, latitude]
                },
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
            let filter: any = { created_by: req.customer.object_id, is_deleted: false };

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

            const { offer_price, target_price, buy_quantity, moq, brand, coo, pin_code, product_location, product_id, individual_pack, master_pack, offer_validity, city, state } =
                req.body;
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
            const customerId = req.customer.object_id;
            const defaultAmountToDeduct = Number(amount);
            const promoAmountToDeduct = Number(discount);
            let result: any;
            const offer: any = await Offers.findOne({ id: offer_id }).lean();
            const product: any = await Product.findOne({ _id: offer?.product_id }).lean();
            const category: any = await Category.findOne({ _id: product?.category_id[0] }).lean();
            const offerCreator: any = await Customer.findOne({ _id: offer?.created_by });
            const unlockingCustomer: any = await Customer.findOne({ _id: req.customer.object_id });
            const wallet0: any = await Wallet.findOne({ customer_id: customerId, type: 0 }).lean();
            const wallet1: any = await Wallet.findOne({ customer_id: customerId, type: 1 }).lean();

            const transaction: any = await Transaction.create({
                amount: parseFloat(Number(amount).toFixed(2)), // => total money charged (gst+commission eg. in simple term total credit/debit from wallet)
                gst,
                sgst,
                cgst,
                igst,
                commission:parseFloat(Number(commission).toFixed(2)),
                transaction_type: 1,
                particular,
                category_id: category.id,
                product_id: product.id,
                lead_id: offer_id,
                offer_price,
                discount,
                closing_balance: parseFloat(Math.max(0, wallet0.balance - defaultAmountToDeduct).toFixed(2)),
                transaction_id: null,
                status: 1,
                remarks: "PURCHASEOFFER",
                customer_id: req.customer.object_id,
            });
            result = await UnlockOffers.create({
                transaction_id: transaction._id,
                price: parseFloat(Number(amount).toFixed(2)),
                commision: commission,
                offer_id: offer._id,
                offer_counter: offer.offer_counter,
                status: 1,
                created_by: req.customer.object_id,
            });

            // Update Wallet Type 0 default wallet
            if (wallet0) {
                await Wallet.findOneAndUpdate(
                    { customer_id: customerId, type: 0 },
                    {
                        balance: parseFloat(Math.max(0, wallet0.balance - defaultAmountToDeduct).toFixed(2)),
                    }
                );
            }

            // Update Wallet Type 1 promo wallet
            if (wallet1) {
                await Wallet.findOneAndUpdate(
                    { customer_id: customerId, type: 1 },
                    {
                        balance: parseFloat(Math.max(0, wallet1.balance - promoAmountToDeduct).toFixed(2)),
                    }
                );
            }

            if (offer.type == 0) {
                const notificationData = {
                    tmplt_name: "seller_opened_buyer_offer",
                    to: offerCreator?.email,
                    dynamicKey: {
                        customer_name: unlockingCustomer?.name,
                        company_name: unlockingCustomer?.trade_name,
                        contact_no: unlockingCustomer?.phone,
                        address: unlockingCustomer?.address_line_1,
                        email_id: unlockingCustomer?.email,
                        product_name: particular,
                    },
                };
                const whatsAppData = {
                    campaignName: "Seller Opened Buyer Offer",
                    userName: offerCreator?.name,
                    destination: offerCreator?.whatapp_num || offerCreator?.phone,
                    templateParams: [
                        particular,
                        unlockingCustomer?.name,
                        unlockingCustomer?.trade_name,
                        unlockingCustomer?.phone,
                        unlockingCustomer?.address_line_1,
                        unlockingCustomer?.email,
                    ],
                };
                prepareNotificationData(notificationData);
                prepareWhatsAppNotificationData(whatsAppData);

                const expirebuyoffer: any = await Offers.findOneAndUpdate({ id: offer_id }, { status: 0 });
            }
            if (offer.type == 1) {
                const notificationData = {
                    tmplt_name: "buyer_opened_seller_offer",
                    to: offerCreator?.email,
                    dynamicKey: {
                        customer_name: unlockingCustomer?.name,
                        company_name: unlockingCustomer?.trade_name,
                        contact_no: unlockingCustomer?.phone,
                        address: unlockingCustomer?.address_line_1,
                        email_id: unlockingCustomer?.email,
                        product_name: particular,
                    },
                };
                const whatsAppData = {
                    campaignName: "Buyer Opened Seller Offer",
                    userName: offerCreator?.name,
                    destination: offerCreator?.whatapp_num || offerCreator?.phone,
                    templateParams: [
                        particular,
                        unlockingCustomer?.name,
                        unlockingCustomer?.trade_name,
                        unlockingCustomer?.phone,
                        unlockingCustomer?.address_line_1,
                        unlockingCustomer?.email,
                    ],
                };
                prepareNotificationData(notificationData);
                prepareWhatsAppNotificationData(whatsAppData);
            }
            console.log(promoAmountToDeduct > 0,"promoAmountToDeduct > 0")
            if (promoAmountToDeduct > 0) {
                const now = moment().tz("Asia/Kolkata").format("YYYY-MM-DD");
                const promoTransactions:any = await PromoTransaction.find({
                    customer_id: customerId,
                    status: true,
                    expiry_date: { $gte: now },
                    remaining_balance: { $gt: 0 },
                }).sort({ createdAt: 1 });

                let remainingDiscount = promoAmountToDeduct;

                for (const promo of promoTransactions) {
                    if (remainingDiscount <= 0) break;

                    if (promo.remaining_balance <= remainingDiscount) {
                        remainingDiscount -= promo.remaining_balance;

                        await PromoTransaction.updateOne({ _id: promo._id }, { remaining_balance: 0 });
                    } else {
                        // partial consume
                        await PromoTransaction.updateOne(
                            { _id: promo._id },
                            {
                                remaining_balance: parseFloat((promo.remaining_balance - remainingDiscount).toFixed(2)),
                            }
                        );

                        remainingDiscount = 0;
                    }
                }
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
