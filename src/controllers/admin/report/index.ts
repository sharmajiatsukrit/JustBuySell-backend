import { Request, Response } from "express";
import { ValidationChain } from "express-validator";
import moment from "moment";
import { Transaction, Customer, Invoice } from "../../../models";
import { removeObjectKeys, serverResponse, serverErrorHandler, removeSpace, constructResponseMsg, serverInvalidRequest, groupByDate } from "../../../utils";
import { HttpCodeEnum } from "../../../enums/server";
import validate from "./validate";
import EmailService from "../../../utils/email";
import Logger from "../../../utils/logger";
import ServerMessages, { ServerMessagesEnum } from "../../../config/messages";

const fileName = "[admin][transaction][index.ts]";
export default class TransactionController {
    public locale: string = "en";
    public emailService;

    constructor() {
        this.emailService = new EmailService();
    }

    public validate(endPoint: string): ValidationChain[] {
        return validate(endPoint);
    }

    public async getInvoices(req: Request, res: Response): Promise<any> {
        try {
            const fn = "[getList]";
            // Set locale
            const { locale, page, limit, search,customer_id,start_date,end_date } = req.query;
            this.locale = (locale as string) || "en";

            const pageNumber = parseInt(page as string) || 1;
            const limitNumber = parseInt(limit as string) || 10;
            const skip = (pageNumber - 1) * limitNumber;
            const filter:any = {};
            // const filter:any = {};
            if (search) {
                // filter.$or = [
                //     { name: { $regex: search, $options: 'i' } }
                // ];
            }
            if(customer_id){
                const customer:any = await Customer.findOne({id:customer_id}).lean();
                filter.customer_id = customer ? customer._id : null;
            }
            // Filter by date range
            if (start_date && end_date) {
                filter.start_date = { $gte: new Date(start_date as string) };
                filter.end_date = { $lte: new Date(end_date as string) };
            }
            const results = await Invoice.find(filter)
                .sort({ _id: -1 }) // Sort by _id in descending order
                .skip(skip)
                .limit(limitNumber).populate("customer_id")
                .lean();

            const totalCount = await Invoice.countDocuments({});
            const totalPages = Math.ceil(totalCount / limitNumber);
            // const result = await State.find({}).sort([['id', 'desc']]).lean();

            if (results.length > 0) {
                    const formattedResult = results.map((item: any) => ({
                    ...item,
                    file: `${process.env.RESOURCE_URL}${item.file}`,

                }));
                return serverResponse(res, HttpCodeEnum.OK, ServerMessages.errorMsgLocale(this.locale, ServerMessagesEnum["unit-fetched"]), { data: formattedResult, totalCount, totalPages, currentPage: pageNumber });
            } else {
                throw new Error(ServerMessages.errorMsgLocale(this.locale, ServerMessagesEnum["not-found"]));
            }
        } catch (err: any) {
            return serverErrorHandler(err, res, err.message, HttpCodeEnum.SERVERERROR, {});
        }
    }

    // Checked
    public async getPaymentReceipt(req: Request, res: Response): Promise<any> {
        try {
            const fn = "[getList]";
            // Set locale
            const { locale, page, limit, search, customer_id, start_date, end_date } = req.query;
            this.locale = (locale as string) || "en";

            const pageNumber = parseInt(page as string) || 1;
            const limitNumber = parseInt(limit as string) || 10;
            const skip = (pageNumber - 1) * limitNumber;

            const filter: any = {};
            filter.status = 1;
            filter.transaction_type = 0;
            // const filter:any = {};
            if (search) {
                // filter.$or = [
                //     { name: { $regex: search, $options: 'i' } }
                // ];
            }
            if (customer_id) {
                const customer: any = await Customer.findOne({ id: customer_id }).lean();
                filter.customer_id = customer ? customer._id : null;
            }
            // Filter by date range
            if (start_date && end_date) {
                filter.createdAt = {
                    $gte: new Date(start_date as string),
                    $lte: new Date(end_date as string),
                };
            }
           
            const results = await Transaction.aggregate([
                { $match: filter },
                { $sort: { _id: -1 } },
                { $skip: skip },
                { $limit: limitNumber },
                {
                    $addFields: {
                        created_date: {
                            $dateToString: { format: "%Y-%m-%d", date: "$createdAt", timezone: "Asia/Kolkata" },
                        },
                        created_time: {
                            $dateToString: { format: "%H:%M", date: "$createdAt", timezone: "Asia/Kolkata" },
                        },
                    },
                },
               
                {
                    $lookup: {
                        from: "customers", 
                        localField: "customer_id",
                        foreignField: "_id",
                        as: "customer_id",
                    },
                },
                {
                    $unwind: { path: "$customer_id", preserveNullAndEmptyArrays: true },
                },
            ]);

            const totalCount = await Transaction.countDocuments({});
            const totalPages = Math.ceil(totalCount / limitNumber);
            // const result = await State.find({}).sort([['id', 'desc']]).lean();

            if (results.length > 0) {
                return serverResponse(res, HttpCodeEnum.OK, ServerMessages.errorMsgLocale(this.locale, ServerMessagesEnum["transactions-fetched"]), {
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
    public async getRevenueReceipt(req: Request, res: Response): Promise<any> {
        try {
            const fn = "[getList]";
            // Set locale
            const { locale, page, limit, search, customer_id, start_date, end_date } = req.query;
            this.locale = (locale as string) || "en";

            const pageNumber = parseInt(page as string) || 1;
            const limitNumber = parseInt(limit as string) || 10;
            const skip = (pageNumber - 1) * limitNumber;

            const filter: any = {};
            // filter.status = 1;
            // filter.transaction_type = 1;
            // const filter:any = {};
            if (search) {
                // filter.$or = [
                //     { name: { $regex: search, $options: 'i' } }
                // ];
            }
            if (customer_id) {
                const customer: any = await Customer.findOne({ id: customer_id }).lean();
                filter.customer_id = customer ? customer._id : null;
            }
            // Filter by date range
            if (start_date && end_date) {
                filter.createdAt = {
                    $gte: new Date(start_date as string),
                    $lte: new Date(end_date as string),
                };
            }
           
            const results = await Transaction.aggregate([
                { $match: filter },
                { $sort: { _id: -1 } },
                { $skip: skip },
                { $limit: limitNumber },
                {
                    $addFields: {
                        created_date: {
                            $dateToString: { format: "%Y-%m-%d", date: "$createdAt", timezone: "Asia/Kolkata" },
                        },
                        created_time: {
                            $dateToString: { format: "%H:%M", date: "$createdAt", timezone: "Asia/Kolkata" },
                        },
                    },
                },
               
                {
                    $lookup: {
                        from: "customers", 
                        localField: "customer_id",
                        foreignField: "_id",
                        as: "customer_id",
                    },
                },
                {
                    $unwind: { path: "$customer_id", preserveNullAndEmptyArrays: true },
                },
            ]);

            const totalCount = await Transaction.countDocuments({});
            const totalPages = Math.ceil(totalCount / limitNumber);
            // const result = await State.find({}).sort([['id', 'desc']]).lean();

            if (results.length > 0) {
                return serverResponse(res, HttpCodeEnum.OK, ServerMessages.errorMsgLocale(this.locale, ServerMessagesEnum["transactions-fetched"]), {
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
    public async getUserWalletTXN(req: Request, res: Response): Promise<any> {
        try {
            const fn = "[getList]";
            // Set locale
            const { locale, page, limit, search, customer_id, start_date, end_date } = req.query;
            this.locale = (locale as string) || "en";

            const pageNumber = parseInt(page as string) || 1;
            const limitNumber = parseInt(limit as string) || 10;
            const skip = (pageNumber - 1) * limitNumber;

            const filter: any = {};
            // const filter:any = {};
            if (search) {
                // filter.$or = [
                //     { name: { $regex: search, $options: 'i' } }
                // ];
            }
            if (customer_id) {
                const customer: any = await Customer.findOne({ id: customer_id }).lean();
                filter.customer_id = customer ? customer._id : null;
            }
            // Filter by date range
            if (start_date && end_date) {
                filter.createdAt = {
                    $gte: new Date(start_date as string),
                    $lte: new Date(end_date as string),
                };
            }
           
            const results = await Transaction.aggregate([
                { $match: filter },
                { $sort: { _id: -1 } },
                { $skip: skip },
                { $limit: limitNumber },
                {
                    $addFields: {
                        created_date: {
                            $dateToString: { format: "%Y-%m-%d", date: "$createdAt", timezone: "Asia/Kolkata" },
                        },
                        created_time: {
                            $dateToString: { format: "%H:%M", date: "$createdAt", timezone: "Asia/Kolkata" },
                        },
                    },
                },
               
                {
                    $lookup: {
                        from: "customers", 
                        localField: "customer_id",
                        foreignField: "_id",
                        as: "customer_id",
                    },
                },
                {
                    $unwind: { path: "$customer_id", preserveNullAndEmptyArrays: true },
                },
            ]);

            const totalCount = await Transaction.countDocuments({});
            const totalPages = Math.ceil(totalCount / limitNumber);
            // const result = await State.find({}).sort([['id', 'desc']]).lean();

            if (results.length > 0) {
                return serverResponse(res, HttpCodeEnum.OK, ServerMessages.errorMsgLocale(this.locale, ServerMessagesEnum["transactions-fetched"]), {
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

    
}
