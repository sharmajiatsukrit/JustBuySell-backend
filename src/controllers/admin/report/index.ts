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
import ExcelJS from "exceljs";
const path = require("path");
const fs = require("fs");

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
            const { locale, page, limit, search, customer_id, start_date, end_date } = req.query;
            this.locale = (locale as string) || "en";

            const pageNumber = parseInt(page as string) || 1;
            const limitNumber = parseInt(limit as string) || 10;
            const skip = (pageNumber - 1) * limitNumber;
            const filter: any = {};
            // const filter:any = {};
            if (search) {
                filter.$or = [{ "customer_id.trade_name": { $regex: search, $options: "i" } }, { "customer_id.gst": { $regex: search, $options: "i" } }];
            }
            if (customer_id) {
                const customer: any = await Customer.findOne({ id: customer_id }).lean();
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
                .limit(limitNumber)
                .populate("customer_id")
                .lean();

            const totalCount = await Invoice.countDocuments({});
            const totalPages = Math.ceil(totalCount / limitNumber);
            // const result = await State.find({}).sort([['id', 'desc']]).lean();

            if (results.length > 0) {
                const formattedResult = results.map((item: any) => ({
                    ...item,
                    file: `${process.env.RESOURCE_URL}${item.file}`,
                }));
                return serverResponse(res, HttpCodeEnum.OK, ServerMessages.errorMsgLocale(this.locale, ServerMessagesEnum["unit-fetched"]), {
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

    //     public async getProductReports(req: Request, res: Response): Promise<any> {
    //     try {
    //         const fn = "[getProductReports]";
    //         const { locale } = req.query as {
    //             locale?: string;
    //         };
    //         this.locale = (locale as string) || "en";

    //         const result: any = await Client.find({status:true}).lean()
    //            console.log(result);
    //         const workbook = new ExcelJS.Workbook();
    //         const worksheet = workbook.addWorksheet('Orders');

    //         // Define columns
    //         worksheet.columns = [
    //             { header: 'Sr No', key: 'srno', width: 10 },
    //             { header: 'Segment', key: 'segment', width: 15 },
    //             { header: 'Wheels Code', key: 'wheel_code', width: 15 },
    //             { header: 'Type', key: 'type', width: 50 },
    //             { header: 'Paint Type', key: 'paint_type', width: 50 },
    //             { header: 'Color', key: 'color', width: 50 },
    //             { header: 'Top Coat', key: 'top_coat', width: 50 },
    //             { header: 'Disc Type', key: 'disc_type', width: 50 },
    //             { header: 'Customer Name', key: 'customer_name', width: 50 },
    //             { header: 'Creation Date', key: 'createdAt', width: 20 },
    //         ];

    //         // Add rows to the worksheet
    //         result.forEach((item: any, index: any) => {

    //             worksheet.addRow({
    //                 srno: index + 1,
    //                 segment: item.segment,
    //                 wheel_code: item.wheel_code,
    //                 type: item.type,
    //                 paint_type: item.paint_type,
    //                 color: item.color,
    //                 top_coat: item.top_coat,
    //                 disc_type: item.disc_type,
    //                 customer_name: item.customer_name,
    //                 createdAt: moment(item.createdAt).format('YYYY-MM-DD HH:mm:ss')
    //             });
    //         });

    //         const timestamp = new Date().toISOString().replace(/[-:.]/g, '');
    //         const fileName = `product_report_${timestamp}.xlsx`;
    //         // Define the file path to save the workbook
    //         const filePath = path.join(process.env.UPLOAD_PATH + '/reports', fileName);

    //         // Ensure the directory exists
    //         if (!fs.existsSync(path.dirname(filePath))) {
    //             fs.mkdirSync(path.dirname(filePath), { recursive: true });
    //         }

    //         // Write the workbook to the file
    //         await workbook.xlsx.writeFile(filePath);
    //         const download_report = `${process.env.APP_URL}/uploads/reports/${fileName}`;
    //         if (result.length > 0) {
    //             return serverResponse(res, HttpCodeEnum.OK, constructResponseMsg(this.locale, "report-exported"), { download_report });
    //         } else {
    //             throw new Error(
    //                 ServerMessages.errorMsgLocale(
    //                     this.locale,
    //                     ServerMessagesEnum["not-found"]
    //                 )
    //             );
    //         }
    //     } catch (err: any) {
    //         return serverErrorHandler(
    //             err,
    //             res,
    //             err.message,
    //             HttpCodeEnum.SERVERERROR,
    //             []
    //         );
    //     }
    // }

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
            // if (search) {
            //     filter.$or = [{ "customer_id.trade_name": { $regex: search, $options: "i" } }, { "customer_id.gst": { $regex: search, $options: "i" } }];
            // }
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

                {
                    $match: { "customer_id.is_gst_verified": true },
                },
                ...(search
                    ? [
                          {
                              $match: {
                                  $or: [{ "customer_id.trade_name": { $regex: search, $options: "i" } }, { "customer_id.gst": { $regex: search, $options: "i" } }],
                              },
                          },
                      ]
                    : []),
                { $sort: { _id: -1 } },
                { $skip: skip },
                { $limit: limitNumber },
            ]);

            const countResult = await Transaction.aggregate([
                { $match: filter },
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
                {
                    $match: { "customer_id.is_gst_verified": true },
                },
                ...(search
                    ? [
                          {
                              $match: {
                                  $or: [{ "customer_id.trade_name": { $regex: search, $options: "i" } }, { "customer_id.gst": { $regex: search, $options: "i" } }],
                              },
                          },
                      ]
                    : []),
                {
                    $count: "total",
                },
            ]);

            const totalCount = countResult[0]?.total || 0;
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

    public async exportPaymentReceiptExcel(req: Request, res: Response): Promise<any> {
        try {
            const { locale, page, limit, search, customer_id, start_date, end_date } = req.query as any;
            this.locale = locale || "en";

            const pageNumber = parseInt(page) || 1;
            const limitNumber = parseInt(limit) || 10;
            const skip = (pageNumber - 1) * limitNumber;

            const filter: any = { status: 1, transaction_type: 0 };

            if (customer_id) {
                const customer: any = await Customer.findOne({ id: customer_id }).lean();
                filter.customer_id = customer ? customer._id : null;
            }
            if (start_date && end_date) {
                filter.createdAt = {
                    $gte: new Date(start_date),
                    $lte: new Date(end_date),
                };
            }

            const results = await Transaction.aggregate([
                { $match: filter },
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
                { $unwind: { path: "$customer_id", preserveNullAndEmptyArrays: true } },
                { $match: { "customer_id.is_gst_verified": true } },
                ...(search
                    ? [
                          {
                              $match: {
                                  $or: [{ "customer_id.trade_name": { $regex: search, $options: "i" } }, { "customer_id.gst": { $regex: search, $options: "i" } }],
                              },
                          },
                      ]
                    : []),
                { $sort: { _id: -1 } },
                { $skip: skip },
                { $limit: limitNumber },
            ]);

            // Set up workbook
            const workbook = new ExcelJS.Workbook();
            const worksheet = workbook.addWorksheet("Payment Receipts");

            worksheet.columns = [
                { header: "Date", key: "createdDate", width: 20 },
                { header: "JBS Txn Ref. Number", key: "jbsRef", width: 22 },
                { header: "User ID", key: "userId", width: 12 },
                { header: "Trade Name", key: "tradeName", width: 30 },
                { header: "GST Number", key: "gst", width: 20 },
                { header: "Payment Gateway", key: "paymentGateway", width: 16 },
                { header: "Payment Gateway Txn ID", key: "paymentGatewayTxnId", width: 28 },
                { header: "Amount credited", key: "amount", width: 16 },
            ];

            results.forEach((item: any) => {
                const createdDateIST = moment(item.createdAt).tz("Asia/Kolkata").format("YYYY-MM-DD HH:mm:ss");
                worksheet.addRow({
                    createdDate: createdDateIST,
                    jbsRef: item?.id,
                    userId: item?.customer_id?.id ?? "",
                    tradeName: item?.customer_id?.trade_name ?? "",
                    gst: item?.customer_id?.gst ?? "",
                    paymentGateway: "Razor Pay",
                    paymentGatewayTxnId: item?.transaction_id ?? item?.razorpay_payment_id ?? "",
                    amount: item?.amount ?? 0,
                });
            });

            worksheet.getRow(1).font = { bold: true };

            // Save to /uploads/reports
            const timestamp = new Date().toISOString().replace(/[-:.]/g, "");
            const fileName = `payment_receipts_${timestamp}.xlsx`;
            const reportsDir = path.join(process.env.UPLOAD_PATH as string, "reports");
            const filePath = path.join(reportsDir, fileName);
            if (!fs.existsSync(reportsDir)) fs.mkdirSync(reportsDir, { recursive: true });

            await workbook.xlsx.writeFile(filePath);

            const download_report = `${process.env.RESOURCE_URL}reports/${fileName}`;

            if (results.length > 0) {
                return serverResponse(res, HttpCodeEnum.OK, constructResponseMsg(this.locale, "report-exported"), { download_report });
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
                {
                    $match: { "customer_id.is_gst_verified": true },
                },
                ...(search
                    ? [
                          {
                              $match: {
                                  $or: [{ "customer_id.trade_name": { $regex: search, $options: "i" } }, { "customer_id.gst": { $regex: search, $options: "i" } }],
                              },
                          },
                      ]
                    : []),
                { $sort: { _id: -1 } },
                { $skip: skip },
                { $limit: limitNumber },
            ]);

            const countResult = await Transaction.aggregate([
                { $match: filter },
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
                {
                    $match: { "customer_id.is_gst_verified": true },
                },

                ...(search
                    ? [
                          {
                              $match: {
                                  $or: [{ "customer_id.trade_name": { $regex: search, $options: "i" } }, { "customer_id.gst": { $regex: search, $options: "i" } }],
                              },
                          },
                      ]
                    : []),
                {
                    $count: "total",
                },
            ]);
            const totalCount = countResult[0]?.total || 0;
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

    public async exportRevenueReceiptExcel(req: Request, res: Response): Promise<any> {
        try {
            const { locale, page, limit, customer_id, search, start_date, end_date } = req.query as any;
            this.locale = locale || "en";

            const pageNumber = parseInt(page) || 1;
            const limitNumber = parseInt(limit) || 10;
            const skip = (pageNumber - 1) * limitNumber;
            const filter: any = {};

            if (customer_id) {
                const customer: any = await Customer.findOne({ id: customer_id }).lean();
                filter.customer_id = customer ? customer._id : null;
            }
            if (start_date && end_date) {
                filter.createdAt = {
                    $gte: new Date(start_date),
                    $lte: new Date(end_date),
                };
            }

            const results = await Transaction.aggregate([
                { $match: filter },
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
                { $unwind: { path: "$customer_id", preserveNullAndEmptyArrays: true } },
                { $match: { "customer_id.is_gst_verified": true } },
                ...(search
                    ? [
                          {
                              $match: {
                                  $or: [{ "customer_id.trade_name": { $regex: search, $options: "i" } }, { "customer_id.gst": { $regex: search, $options: "i" } }],
                              },
                          },
                      ]
                    : []),
                { $sort: { _id: -1 } },
                { $skip: skip },
                { $limit: limitNumber },
            ]);

            // Prepare workbook
            const workbook = new ExcelJS.Workbook();
            const worksheet = workbook.addWorksheet("Revenue Receipts");

            worksheet.columns = [
                { header: "Date", key: "createdDate", width: 20 },
                { header: "User ID", key: "userId", width: 12 },
                { header: "Trade Name", key: "tradeName", width: 30 },
                { header: "JBS Txn ID", key: "jbsTxnId", width: 16 },
                { header: "Category ID", key: "categoryId", width: 14 },
                { header: "Product ID", key: "productId", width: 14 },
                { header: "Lead ID", key: "leadId", width: 14 },
                { header: "GST Number", key: "gst", width: 20 },
                { header: "Value of Credits", key: "valueOfCredits", width: 18 },
                { header: "Discount", key: "discount", width: 12 },
                { header: "Taxable Value", key: "taxableValue", width: 16 },
                { header: "CGST", key: "cgst", width: 12 },
                { header: "SGST", key: "sgst", width: 12 },
                { header: "IGST", key: "igst", width: 12 },
                { header: "Total Value", key: "totalValue", width: 16 },
            ];

            results.forEach((doc: any) => {
                const item = {
                    id: doc?.id,
                    amount: doc?.amount ?? 0,
                    discount: doc?.discount ?? 0,
                    commission: doc?.commission ?? 0,
                    cgst: doc?.cgst ?? 0,
                    sgst: doc?.sgst ?? 0,
                    igst: doc?.igst ?? 0,
                    customerId: {
                        id: doc?.customer_id?.id,
                        tradeName: doc?.customer_id?.trade_name,
                        gst: doc?.customer_id?.gst,
                    },
                    categoryId: doc?.categoryId ?? null,
                    productId: doc?.productId ?? null,
                    lead: doc?.lead ?? null,
                    createdAt: doc?.createdAt,
                };

                const createdDateIST = moment(item.createdAt).tz("Asia/Kolkata").format("YYYY-MM-DD HH:mm:ss");

                worksheet.addRow({
                    createdDate: createdDateIST,
                    userId: item.customerId?.id ?? "",
                    tradeName: item.customerId?.tradeName ?? "",
                    jbsTxnId: item.id ?? "",
                    categoryId: item.categoryId?.id ?? "-",
                    productId: item.productId?.id ?? "-",
                    leadId: item.lead?.id ?? "-",
                    gst: item.customerId?.gst ?? "",
                    valueOfCredits: item.amount ?? 0,
                    discount: item.discount ?? 0,
                    taxableValue: item.commission ?? 0,
                    cgst: item.cgst ?? 0,
                    sgst: item.sgst ?? 0,
                    igst: item.igst ?? 0,
                    totalValue: item.amount ?? 0,
                });
            });

            worksheet.getRow(1).font = { bold: true };

            // Save file
            const timestamp = new Date().toISOString().replace(/[-:.]/g, "");
            const fileName = `revenue_receipts_${timestamp}.xlsx`;
            const reportsDir = path.join(process.env.UPLOAD_PATH as string, "reports");
            const filePath = path.join(reportsDir, fileName);
            if (!fs.existsSync(reportsDir)) fs.mkdirSync(reportsDir, { recursive: true });

            await workbook.xlsx.writeFile(filePath);

            const download_report = `${process.env.RESOURCE_URL}reports/${fileName}`;
            return serverResponse(res, HttpCodeEnum.OK, constructResponseMsg(this.locale, "report-exported"), { download_report });
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
                {
                    $match: { "customer_id.is_gst_verified": true },
                },
                ...(search
                    ? [
                          {
                              $match: {
                                  $or: [{ "customer_id.trade_name": { $regex: search, $options: "i" } }, { "customer_id.gst": { $regex: search, $options: "i" } }],
                              },
                          },
                      ]
                    : []),
                { $sort: { _id: -1 } },
                { $skip: skip },
                { $limit: limitNumber },
            ]);

            const countResult = await Transaction.aggregate([
                { $match: filter },

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
                {
                    $match: { "customer_id.is_gst_verified": true },
                },
                ...(search
                    ? [
                          {
                              $match: {
                                  $or: [{ "customer_id.trade_name": { $regex: search, $options: "i" } }, { "customer_id.gst": { $regex: search, $options: "i" } }],
                              },
                          },
                      ]
                    : []),
                { $sort: { _id: -1 } },
                { $skip: skip },
                { $limit: limitNumber },
                {
                    $count: "total",
                },
            ]);

            const totalCount = countResult[0]?.total || 0;
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

    public async exportUserWalletTXNExcel(req: Request, res: Response): Promise<any> {
        try {
            const { locale, page, limit, customer_id, search, start_date, end_date } = req.query as any;
            this.locale = locale || "en";

            const pageNumber = parseInt(page) || 1;
            const limitNumber = parseInt(limit) || 10;
            const skip = (pageNumber - 1) * limitNumber;

            // Reuse the same filter logic
            const filter: any = {};
            if (customer_id) {
                const customer: any = await Customer.findOne({ id: customer_id }).lean();
                filter.customer_id = customer ? customer._id : null;
            }
            if (start_date && end_date) {
                filter.createdAt = {
                    $gte: new Date(start_date),
                    $lte: new Date(end_date),
                };
            }

            // Aggregate with IST fields and GST-verified customers
            const results = await Transaction.aggregate([
                { $match: filter },
                { $sort: { _id: -1 } },
                { $skip: skip },
                { $limit: limitNumber },
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
                { $unwind: { path: "$customer_id", preserveNullAndEmptyArrays: true } },
                { $match: { "customer_id.is_gst_verified": true } },
                ...(search
                    ? [
                          {
                              $match: {
                                  $or: [{ "customer_id.trade_name": { $regex: search, $options: "i" } }, { "customer_id.gst": { $regex: search, $options: "i" } }],
                              },
                          },
                      ]
                    : []),
                { $sort: { _id: -1 } },
                { $skip: skip },
                { $limit: limitNumber },
            ]);

            // Prepare workbook and worksheet
            const workbook = new ExcelJS.Workbook();
            const worksheet = workbook.addWorksheet("User Wallet TXN");

            // Exactly the 10 columns listed in your TableHead
            worksheet.columns = [
                { header: "Date", key: "date", width: 20 },
                { header: "User ID", key: "userId", width: 12 },
                { header: "User Trade Name", key: "tradeName", width: 30 },
                { header: "Transaction Type", key: "transactionType", width: 18 },
                { header: "No. of Credits", key: "credits", width: 16 },
                { header: "JBS Txn Ref No", key: "jbsRef", width: 18 },
                { header: "INR Amount (Basic)", key: "amountBasic", width: 20 },
                { header: "INR Amount (GST)", key: "amountGst", width: 18 },
                { header: "INR Amount (Total)", key: "amountTotal", width: 20 },
                { header: "Closing Credit", key: "closingCredit", width: 16 },
            ];

            results.forEach((doc: any) => {
                const createdDateIST = moment(doc.createdAt).tz("Asia/Kolkata").format("YYYY-MM-DD HH:mm:ss");
                worksheet.addRow({
                    date: createdDateIST,
                    userId: doc?.customer_id?.id ?? "",
                    tradeName: doc?.customer_id?.trade_name ?? "",
                    transactionType: doc?.transaction_type ?? "",
                    credits: doc?.amount ?? "-",
                    jbsRef: doc?.id ?? "-",
                    amountBasic: doc?.amount ?? "-",
                    amountGst: doc?.gst ?? "-",
                    amountTotal: doc?.amount ?? "-",
                    closingCredit: doc?.closingCredit ?? "0",
                });
            });

            worksheet.getRow(1).font = { bold: true };

            // Save under /reports and return the given URL pattern
            const timestamp = new Date().toISOString().replace(/[-:.]/g, "");
            const fileName = `user_wallet_txn_${timestamp}.xlsx`;
            const reportsDir = path.join(process.env.UPLOAD_PATH as string, "reports");
            const filePath = path.join(reportsDir, fileName);
            if (!fs.existsSync(reportsDir)) fs.mkdirSync(reportsDir, { recursive: true });

            await workbook.xlsx.writeFile(filePath);

            // Use exact path pattern requested
            const download_report = `${process.env.RESOURCE_URL}reports/${fileName}`;

            return serverResponse(res, HttpCodeEnum.OK, constructResponseMsg(this.locale, "report-exported"), { download_report });
        } catch (err: any) {
            return serverErrorHandler(err, res, err.message, HttpCodeEnum.SERVERERROR, {});
        }
    }
}
