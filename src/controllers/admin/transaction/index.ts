import { Request, Response } from "express";
import { ValidationChain } from "express-validator";
import moment from "moment";
import { Transaction, Customer } from "../../../models";
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

    // Checked
    public async getList(req: Request, res: Response): Promise<any> {
        try {
            const fn = "[getList]";
            // Set locale
            const { locale, page, limit, search, customer_id, start_date, end_date, type, status } = req.query;
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
            if (type) {
                const typeNumber = Number(type);
                
                if (typeNumber === 1) {// Debit
                    console.log(typeNumber,"Debit")
                    filter.status = 1;
                    filter.transaction_type = 1;
                } else if (typeNumber === 2) {// Credit
                    console.log(typeNumber,"Cebit")
                    filter.status = 1;
                    filter.transaction_type = 0;
                }
            }
            if(status){

            }
            console.log(filter)

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

    public async getById(req: Request, res: Response): Promise<any> {
        try {
            const fn = "[getById]";
            // Set locale
            const { locale } = req.query;
            this.locale = (locale as string) || "en";

            const id = parseInt(req.params.id);
            const result: any = await Transaction.aggregate([
                { $match: { id: id } },
                {
                    $addFields: {
                        created_date: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt", timezone: "Asia/Kolkata" } },
                        created_time: { $dateToString: { format: "%H:%M", date: "$createdAt", timezone: "Asia/Kolkata" } },
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

            if (result) {
                return serverResponse(res, HttpCodeEnum.OK, ServerMessages.errorMsgLocale(this.locale, ServerMessagesEnum["unit-fetched"]), result[0]);
            } else {
                throw new Error(ServerMessages.errorMsgLocale(this.locale, ServerMessagesEnum["not-found"]));
            }
        } catch (err: any) {
            return serverErrorHandler(err, res, err.message, HttpCodeEnum.SERVERERROR, {});
        }
    }
}
