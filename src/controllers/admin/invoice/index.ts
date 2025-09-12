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
            // const invoice_id = `JBSINV_${Date.now()}`;
            // const result: any = await Invoice.create({
            //     amount: 200,
            //     gst: 36,
            //     invoice_id: invoice_id,
            //     start_date: '2024-09-01',
            //     end_date: '2024-09-31',
            //     month: '09',
            //     year: '2024',
            //     file: '2024',
            //     customer_id: '66c85f3e2008c88d275fa432'
            // });
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
