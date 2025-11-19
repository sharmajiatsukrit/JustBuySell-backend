import { Request, Response } from "express";
import { ValidationChain } from "express-validator";
import moment from "moment";
import { Offers, Customer } from "../../../models";
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

    // Checked
    // public async getList(req: Request, res: Response): Promise<any> {
    //     try {
    //         const fn = "[getList]";
    //         // Set locale
    //         const { locale, page, limit, search, customer_id, start_date, end_date } = req.query;
    //         this.locale = (locale as string) || "en";

    //         const pageNumber = parseInt(page as string) || 1;
    //         const limitNumber = parseInt(limit as string) || 5;

    //         const skip = (pageNumber - 1) * limitNumber;
    //         const filter: any = {};
    //         if (search) {
    //             filter.$or = [{ "product_id.name": { $regex: search, $options: "i" } }];
    //         }
    //         if (customer_id) {
    //             const customer: any = await Customer.findOne({ id: customer_id }).lean();
    //             filter.customer_id = customer ? customer._id : null;
    //         }
    //         // Filter by date range
    //         if (start_date && end_date) {
    //             filter.createdAt = {
    //                 $gte: new Date(start_date as string),
    //                 $lte: new Date(end_date as string),
    //             };
    //         }

    //         const result = await Offers.find(filter).sort({ id: -1 }).skip(skip).limit(limitNumber).populate("created_by").populate("product_id").lean();

    //         const totalCount = await Offers.countDocuments(filter);

    //         if (result.length > 0) {
    //             const totalPages = Math.ceil(totalCount / limitNumber);
    //             return serverResponse(res, HttpCodeEnum.OK, ServerMessages.errorMsgLocale(this.locale, ServerMessagesEnum["offer-fetched"]), { result, totalCount, totalPages });
    //         } else {
    //             throw new Error(ServerMessages.errorMsgLocale(this.locale, ServerMessagesEnum["not-found"]));
    //         }
    //     } catch (err: any) {
    //         return serverErrorHandler(err, res, err.message, HttpCodeEnum.SERVERERROR, {});
    //     }
    // }

      public async getList(req: Request, res: Response): Promise<any> {
        try {
            const fn = "[getList]";
            const { locale, page, limit, search, customer_id, start_date, end_date } = req.query;
            this.locale = (locale as string) || "en";

            const pageNumber = parseInt(page as string) || 1;
            const limitNumber = parseInt(limit as string) || 5;
            const skip = (pageNumber - 1) * limitNumber;
           
            let matchQuery: any = {is_deleted:false};

            if (search) {
                matchQuery.$or = [
                    { "product.name": { $regex: search, $options: "i" } },
                    { "created_by.name": { $regex: search, $options: "i" } },
                ];
            }

            if (customer_id) {
                 matchQuery = {...matchQuery,"created_by.id": Number(customer_id)};
            }

            if (start_date && end_date) {
                matchQuery.createdAt = {
                    $gte: new Date(start_date as string),
                    $lte: new Date(end_date as string),
                };
            }


            const pipeline: any[] = [
                {
                    $lookup: {
                    from: "products",
                    localField: "product_id",
                    foreignField: "_id",
                    as: "product_id",
                    },
                },
                { $unwind: { path: "$product_id", preserveNullAndEmptyArrays: true } },

                {
                    $lookup: {
                    from: "customers", 
                    localField: "created_by",
                    foreignField: "_id",
                    as: "created_by",
                    },
                },
                { $unwind: { path: "$created_by", preserveNullAndEmptyArrays: true } },

                { $match: matchQuery },

                { $sort: { id: -1 } },

                { $skip: skip },
                { $limit: limitNumber },
            ];

           
            const result = await Offers.aggregate(pipeline);

            const totalCountPipeline = [
                {
                    $lookup: {
                    from: "products",
                    localField: "product_id",
                    foreignField: "_id",
                    as: "product_id",
                    },
                },
                { $unwind: { path: "$product", preserveNullAndEmptyArrays: true } },
                {
                    $lookup: {
                    from: "customers",
                    localField: "created_by",
                    foreignField: "_id",
                    as: "created_by",
                    },
                },
                { $unwind: { path: "$created_by", preserveNullAndEmptyArrays: true } },
                { $match: matchQuery },
                { $count: "total" },
            ];

            const totalCountResult = await Offers.aggregate(totalCountPipeline);
            const totalCount = totalCountResult[0]?.total || 0;
            const totalPages = Math.ceil(totalCount / limitNumber);

            if (result.length > 0) {
                return serverResponse(
                    res,
                    HttpCodeEnum.OK,
                    ServerMessages.errorMsgLocale(this.locale, ServerMessagesEnum["offer-fetched"]),
                    {
                    result,
                    totalCount,
                    totalPages,
                    currentPage: pageNumber,
                    }
                );
            } else {
                throw new Error(
                    ServerMessages.errorMsgLocale(this.locale, ServerMessagesEnum["not-found"])
                );
            }
        } catch (err: any) {
            return serverErrorHandler(err, res, err.message, HttpCodeEnum.SERVERERROR, {});
        }
    }

    //get byid list
    public async getById(req: Request, res: Response): Promise<any> {
        try {
            const fn = "[getById]";
            const { locale } = req.query;
            this.locale = (locale as string) || "en";

            const id = parseInt(req.params.id);
            const result: any = await Offers.findOne({ id: id }).lean();

            if (result) {
                return serverResponse(res, HttpCodeEnum.OK, constructResponseMsg(this.locale, "offer-fetched"), result);
            } else {
                throw new Error(ServerMessages.errorMsgLocale(this.locale, ServerMessagesEnum["not-found"]));
            }
        } catch (err: any) {
            return serverErrorHandler(err, res, err.message, HttpCodeEnum.SERVERERROR, {});
        }
    }

    //add
    public async add(req: Request, res: Response): Promise<any> {
        try {
            const fn = "[add]";
            const { locale } = req.query;
            this.locale = (locale as string) || "en";

            const { productid, priceperunit, miniquantity, origin, pin, type, status } = req.body;

            let result: any;

            result = await Offers.create({
                productid: productid,
                priceperunit: priceperunit,
                miniquantity: miniquantity,
                origin: origin,
                pin: pin,
                type: type,
                status: status,
            });

            return serverResponse(res, HttpCodeEnum.OK, constructResponseMsg(this.locale, "offer-add"), result.doc);
        } catch (err: any) {
            return serverErrorHandler(err, res, err.message, HttpCodeEnum.SERVERERROR, {});
        }
    }

    //update
    public async update(req: Request, res: Response): Promise<any> {
        try {
            const fn = "[update]";

            const { id } = req.params;
            Logger.info(`${fileName + fn} category_id: ${id}`);

            const { locale } = req.query;
            this.locale = (locale as string) || "en";
            const { productid, priceperunit, miniquantity, origin, pin, type, status } = req.body;

            let result: any = await Offers.findOneAndUpdate(
                { id: id },
                {
                    productid: productid,
                    priceperunit: priceperunit,
                    miniquantity: miniquantity,
                    origin: origin,
                    pin: pin,
                    type: type,
                    status: status,
                }
            );

            const updatedData: any = await Offers.find({ id: id }).lean();

            return serverResponse(res, HttpCodeEnum.OK, constructResponseMsg(this.locale, "offer-update"), updatedData);
        } catch (err: any) {
            return serverErrorHandler(err, res, err.message, HttpCodeEnum.SERVERERROR, {});
        }
    }

    public async updateStatus(req: Request, res: Response): Promise<any> {
        try {
            const { locale } = req.query;
            this.locale = (locale as string) || "en";

            const { id } = req.params;
            const { status } = req.body;

            const updatedData = await Offers.findOne({ id: id });

            if (updatedData) {
                updatedData.status = status;
                await updatedData.save();

                return serverResponse(res, HttpCodeEnum.OK, ServerMessages.errorMsgLocale(this.locale, ServerMessagesEnum["offer-update"]), {});
            } else {
                throw new Error(ServerMessages.errorMsgLocale(this.locale, ServerMessagesEnum["not-found"]));
            }
        } catch (err: any) {
            return serverErrorHandler(err, res, err.message, HttpCodeEnum.SERVERERROR, {});
        }
    }

    //delete
    public async delete(req: Request, res: Response): Promise<any> {
        try {
            const fn = "[delete]";
            const { locale } = req.query;
            this.locale = (locale as string) || "en";

            const { id } = req.params;
            const result = await Offers.deleteOne({ id: id });

            if (result) {
                return serverResponse(res, HttpCodeEnum.OK, constructResponseMsg(this.locale, "offer-delete"), result);
            } else {
                throw new Error(ServerMessages.errorMsgLocale(this.locale, ServerMessagesEnum["not-found"]));
            }
        } catch (err: any) {
            return serverErrorHandler(err, res, err.message, HttpCodeEnum.SERVERERROR, {});
        }
    }
}
