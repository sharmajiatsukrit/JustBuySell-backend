import { Request, Response } from "express";
import { ValidationChain } from "express-validator";
import moment from "moment";
import { Invoice, Customer, Transaction } from "../../../models";
import { removeObjectKeys, serverResponse, serverErrorHandler, removeSpace, constructResponseMsg, serverInvalidRequest, groupByDate } from "../../../utils";
import { HttpCodeEnum } from "../../../enums/server";
import validate from "./validate";
import EmailService from "../../../utils/email";
import Logger from "../../../utils/logger";
import ServerMessages, { ServerMessagesEnum } from "../../../config/messages";
import { generateInvoicePDF } from "../../../utils/generate-pdf/pdf";
import ExcelJS from "exceljs";
const path = require("path");
const fs = require("fs");

const fileName = "[admin][invoice][index.ts]";
export default class InvoiceController {
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
            const { locale, page, limit, search, customer_id, start_date, end_date } = req.query;
            this.locale = (locale as string) || "en";

            const pageNumber = parseInt(page as string) || 1;
            const limitNumber = parseInt(limit as string) || 10;
            const skip = (pageNumber - 1) * limitNumber;

            let filter: any = {};
            const orConditions: any = [
                { name: { $regex: search, $options: "i" } },
                { invoice_number: { $regex: search, $options: "i" } },
                { "customer_id.trade_name": { $regex: search, $options: "i" } },
            ];

            if (search) {
                filter.$or = orConditions;
            }
            if (customer_id) {
                filter = { ...filter, "customer_id.id": Number(customer_id) };
            }

            // Filter by date range
            if (start_date && end_date) {
                filter.start_date = { $gte: start_date };

                filter.end_date = { $lte: end_date };
            }
            const pipeline: any[] = [
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
                    $match: { ...filter, "customer_id.is_gst_verified": true },
                },

                { $sort: { _id: -1 } },
                { $skip: skip },
                { $limit: limitNumber },
            ];

            const results = await Invoice.aggregate(pipeline);

            const totalCountResult: any = await Invoice.aggregate([
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
                    $match: { ...filter, "customer_id.is_gst_verified": true },
                },

                {
                    $count: "total",
                },
            ]);
            const totalCount = totalCountResult[0]?.total || 0;
            const totalPages = Math.ceil(totalCount / limitNumber);

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

    public async exportInvoiceExcel(req: Request, res: Response): Promise<any> {
        try {
            const { locale, page, limit, search, customer_id, start_date, end_date } = req.query;
            this.locale = (locale as string) || "en";

            const pageNumber = parseInt(page as string) || 1;
            const limitNumber = parseInt(limit as string) || 10;
            const skip = (pageNumber - 1) * limitNumber;

            let filter: any = {};
            const orConditions: any = [
                { name: { $regex: search, $options: "i" } },
                { invoice_number: { $regex: search, $options: "i" } },
                { "customer_id.trade_name": { $regex: search, $options: "i" } },
            ];

            if (search) {
                filter.$or = orConditions;
            }
            if (customer_id) {
                filter = { ...filter, "customer_id.id": Number(customer_id) };
            }

            // Filter by date range
            if (start_date && end_date) {
                filter.start_date = { $gte: new Date(start_date as string) };

                filter.end_date = { $lte: new Date(end_date as string) };
            }
            const pipeline: any[] = [
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
                    $match: { ...filter, "customer_id.is_gst_verified": true },
                },

                { $sort: { _id: -1 } },
                { $skip: skip },
                { $limit: limitNumber },
            ];
            const results = await Invoice.aggregate(pipeline);
            // Set up workbook
            const workbook = new ExcelJS.Workbook();
            const worksheet = workbook.addWorksheet("Invoices");

            worksheet.columns = [
                { header: "User Id", key: "userId", width: 12 },
                { header: "GST Number", key: "gstNumber", width: 20 },
                { header: "Trade Name", key: "tradeName", width: 30 },
                { header: "Address", key: "address", width: 40 },
                { header: "Invoice Date", key: "invoiceDate", width: 15 },
                { header: "Invoice No.", key: "invoiceNumber", width: 20 },
                { header: "Discount", key: "discount", width: 12 },
                { header: "Taxable Value", key: "taxableValue", width: 15 },
                { header: "CGST", key: "cgst", width: 12 },
                { header: "SGST", key: "sgst", width: 12 },
                { header: "IGST", key: "igst", width: 12 },
                { header: "Invoice Value", key: "invoiceValue", width: 15 },
                { header: "HSN Number", key: "hsnNumber", width: 15 },
                { header: "Download Link", key: "file", width: 55 },
            ];

            results.forEach((item: any) => {
                const invoiceDateFormatted = moment(item.endDate).format("DD/MM/YYYY");

                // Calculate taxable value (total amount minus taxes)
                const totalAmount = Number(item.total_amount || "0");
                const cgst = Number(item.cgst || "0");
                const sgst = Number(item.sgst || "0");
                const igst = Number(item.igst || "0");
                const taxableValue = totalAmount - (+cgst + sgst + igst);

                worksheet.addRow({
                    userId: item?.customer_id?.id ?? "",
                    gstNumber: item?.customer_id?.gst ?? "",
                    tradeName: item?.customer_id?.trade_name ?? "",
                    address: item?.customer_id?.address_line_1 ?? "",
                    invoiceDate: invoiceDateFormatted,
                    invoiceNumber: item?.invoice_number ?? "",
                    discount: Number(item?.total_discount ?? "0"),
                    taxableValue: taxableValue.toFixed(2),
                    cgst: Number(item?.cgst ?? "0"),
                    sgst: Number(item?.sgst ?? "0"),
                    igst: Number(item?.igst ?? "0"),
                    invoiceValue: Number(totalAmount ?? "0"),
                    hsnNumber: "99843100",
                    file: item?.file ? `${process.env.RESOURCE_URL}${item.file}` : "",
                });
            });

            worksheet.getRow(1).font = { bold: true };

            // Save to /uploads/reports
            const timestamp = new Date().toISOString().replace(/[-:.]/g, "");
            const fileName = `invoices_${timestamp}.xlsx`;
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
    public async getById(req: Request, res: Response): Promise<any> {
        try {
            const fn = "[getById]";
            // Set locale
            const { locale } = req.query;
            this.locale = (locale as string) || "en";

            const id = parseInt(req.params.id);
            const result: any = await Invoice.findOne({ id: id }).lean();

            if (result) {
                result.file = `${process.env.RESOURCE_URL}${result.file}`;
                return serverResponse(res, HttpCodeEnum.OK, ServerMessages.errorMsgLocale(this.locale, ServerMessagesEnum["unit-fetched"]), result);
            } else {
                throw new Error(ServerMessages.errorMsgLocale(this.locale, ServerMessagesEnum["not-found"]));
            }
        } catch (err: any) {
            return serverErrorHandler(err, res, err.message, HttpCodeEnum.SERVERERROR, {});
        }
    }

    public async generateCurrentMonthInvoice(req: Request, res: Response): Promise<any> {
        try {
            const fn = "[updateExpiredOffers]";

            const startOfMonth = moment().startOf("month").toDate();
            const endOfMonth = moment().endOf("day").toDate();

            const customers = await Customer.find({ is_gst_verified: true, status: 1 });

            for (const customer of customers) {
                const transactions = await Transaction.find({
                    customer_id: customer._id,
                    transaction_type: 1,
                    status: 1,
                    createdAt: { $gte: startOfMonth, $lte: endOfMonth },
                });

                if (transactions.length === 0) continue;

                const subTotalAmount = transactions.reduce((sum: any, txn: any) => sum + Number(txn.commission), 0);
                const totalDiscount = transactions.reduce((sum: any, txn: any) => sum + Number(txn.discount), 0);
                const totalGst = transactions.reduce((sum: any, txn: any) => sum + Number(txn.gst), 0);
                const totalIGst = transactions.reduce((sum: any, txn: any) => sum + Number(txn.igst), 0);
                const totalCGst = transactions.reduce((sum: any, txn: any) => sum + Number(txn.cgst), 0);
                const totalSGst = transactions.reduce((sum: any, txn: any) => sum + Number(txn.sgst), 0);

                const sameState = customer?.gst?.substring(0, 2) === "07AAOCS3727K1ZV"?.substring(0, 2);

                // 🔹 Check if invoice already exists for this customer + month + year
                let invoice = await Invoice.findOne({
                    customer_id: customer._id,
                    month: moment(startOfMonth).format("MM"),
                    year: moment(startOfMonth).format("YYYY"),
                });

                if (!invoice) {
                    // Create new if not exists
                    invoice = new Invoice({
                        customer_id: customer._id,
                        customerName: customer.name,
                    });
                }

                // 🔹 Update invoice details (new or existing)
                invoice.set({
                    total_amount: (subTotalAmount - totalDiscount + totalGst).toFixed(2),
                    total_discount: totalDiscount.toFixed(2),
                    gst: totalGst.toFixed(2),
                    igst: totalIGst.toFixed(2),
                    cgst: totalCGst.toFixed(2),
                    sgst: totalSGst.toFixed(2),
                    start_date: moment(startOfMonth).format("YYYY-MM-DD"),
                    end_date: moment(endOfMonth).format("YYYY-MM-DD"),
                    month: moment(startOfMonth).format("MM"),
                    year: moment(startOfMonth).format("YYYY"),
                    transactions: transactions.map((txn) => txn._id),
                });

                await invoice.save();

                const serialNumber = String(invoice.id).padStart(6, "0");
                const pdfName = `JBS${serialNumber}.pdf`;
                const invoiceNumber = `JBS${serialNumber}`;

                await Invoice.findOneAndUpdate({ _id: invoice._id }, { file: pdfName, invoice_number: invoiceNumber }, { new: true });

                const dataForPdf = {
                    userDetails: {
                        name: customer.name,
                        company: customer.trade_name || "",
                        address1: customer.address_line_1 || "",
                        landmark: customer.landmark || "",
                        gstNumber: customer.gst || "",
                    },
                    invoiceDetails: {
                        invoiceNumber: invoiceNumber,
                        invoiceDate: moment().format("DD-MM-YYYY"),
                    },
                    transactions: transactions.map((txn: any, index) => ({
                        item: index + 1,
                        description: txn.remarks,
                        amount: Number(txn.commission).toFixed(2),
                        dateOfTxn: moment(txn.createdAt).utcOffset("+05:30").format("DD-MM-YYYY"),
                        gst: Number(txn.gst).toFixed(2),
                        igst: Number(txn.igst).toFixed(2),
                        cgst: Number(txn.cgst).toFixed(2),
                        sgst: Number(txn.sgst).toFixed(2),
                        discount: Number(txn.discount).toFixed(2),
                        commission: Number(txn.commission).toFixed(2),
                        offer_price: Number(txn.offer_price).toFixed(2),
                        particular: txn.particular,
                    })),
                    subTotalAmount: Number(subTotalAmount).toFixed(2),
                    totalDiscount: Number(totalDiscount).toFixed(2),
                    totalTaxableAmount: Number(subTotalAmount - totalDiscount).toFixed(2),
                    totalAmount: Number(subTotalAmount - totalDiscount + totalGst).toFixed(2),
                    gstLabel: sameState ? `CGST:(9%) SGST:(9%)` : " IGST:(18%) ",
                    igstLabel: !sameState ? `IGST(18%)` : false,
                    cgstLabel: sameState ? `CGST:(9%)` : false,
                    sgstLabel: sameState ? `SGST:(9%) ` : false,
                    totalGst: totalGst.toFixed(2),
                    totalIGst: totalIGst.toFixed(2),
                    totalCGst: totalCGst.toFixed(2),
                    totalSGst: totalSGst.toFixed(2),
                    startOfMonth: moment(startOfMonth).format("DD-MM-YYYY"),
                    endOfMonth: moment(endOfMonth).format("DD-MM-YYYY"),
                };

                await generateInvoicePDF(dataForPdf, pdfName);
            }
            return serverResponse(res, HttpCodeEnum.OK, ServerMessages.errorMsgLocale(this.locale, ServerMessagesEnum["unit-fetched"]), {});
        } catch (err: any) {
            return serverErrorHandler(err, res, err.message, HttpCodeEnum.SERVERERROR, {});
        }
    }
}
