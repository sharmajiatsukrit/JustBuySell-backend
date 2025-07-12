import { Request, Response } from "express";

import moment from "moment";
import { Customer, Invoice, Offers, Transaction, User } from "../../models";
import { HttpCodeEnum } from "../../enums/server";
import Logger from "../../utils/logger";
import { generateInvoicePDF } from "../../utils/generate-pdf/pdf";
import { serverResponse } from "../../utils";
import ServerMessages, { ServerMessagesEnum } from "../../config/messages";

const fileName = "[admin][cron][index.ts]";
export default class CronController {
    public locale: string = "en";
    // public emailService;

    constructor() {
        // this.emailService = new EmailService();
    }

    // Checked
    public async updateExpiredOffers(): Promise<any> {
        try {
            const fn = "[updateExpiredOffers]";
            const filter: any = {};
            const now = moment().toDate();
            // filter.status = 1;
            // filter.$expr = {
            //     $lte: [
            //         {
            //             $add: [
            //                 { $toDate: "$publish_date" },
            //                 {
            //                     $multiply: [
            //                         { $toInt: { $arrayElemAt: [{ $split: ["$offer_validity", ":"] }, 0] } },
            //                         60 * 60 * 1000
            //                     ]
            //                 }
            //             ]
            //         },
            //         now
            //     ]
            // };
            // const offers:any = await Offers.find(filter).sort({ _id: -1 }).limit(10).lean();

            // const now = moment().toDate();

            await Offers.updateMany(
                {
                    status: 1,
                    $expr: {
                        $lte: [
                            {
                                $add: [
                                    { $toDate: "$publish_date" },
                                    {
                                        $multiply: [
                                            { $toInt: { $arrayElemAt: [{ $split: ["$offer_validity", ":"] }, 0] } },
                                            60 * 60 * 1000, // Convert hours to ms
                                        ],
                                    },
                                ],
                            },
                            now,
                        ],
                    },
                },
                {
                    $set: { status: 0 }, // or 'expired' depending on your schema
                }
            );

            // console.log(offers);
        } catch (err: any) {
            // return serverErrorHandler(
            //     err,
            //     res,
            //     err.message,
            //     HttpCodeEnum.SERVERERROR,
            //     {}
            // );
        }
    }

    public async generateInvoice(): Promise<any> {
        try {
            const fn = "[updateExpiredOffers]";
            const filter: any = {};
            const now = moment().toDate();

            const startOfMonth = moment().startOf("month").toDate();
            const endOfMonth = moment().endOf("month").toDate();

            const customers = await Customer.find({ is_gst_verified: true, status: 1 });

            for (const customer of customers) {
                const transactions = await Transaction.find({
                    customer_id: customer._id,
                    transaction_type: 1,
                    status: 1,
                    createdAt: { $gte: startOfMonth, $lte: endOfMonth },
                });
                if (transactions.length === 0) continue;
                const totalAmount = transactions.reduce((sum, txn) => sum + txn.amount, 0);
                const totalGst = transactions.reduce((sum, txn) => sum + txn.gst, 0);
               

                const pdfName = `JBSINV_${moment().unix()}.pdf`;
                const invoiceNumber = `JBSINV_${moment().unix()}`;
                const invoice = new Invoice({
                    customerId: customer._id,
                    customerName: customer.name,
                    gst: totalGst,
                    file: pdfName,
                    start_date: moment(startOfMonth).format("YYYY-MM-DD"),
                    end_date: moment(endOfMonth).format("YYYY-MM-DD"),
                    month: moment(startOfMonth).format("MM"),
                    year: moment(startOfMonth).format("YYYY"),
                    transactions: transactions.map((txn) => txn._id),
                    amount: totalAmount,
                    invoice_number:invoiceNumber
                });

                await invoice.save();
                 const dataForPdf = {
                    userDetails: {
                        name: customer.name,
                        company: customer.trade_name || "",
                        address1: customer.address_line_1 || "",
                        address2: customer.address_line_2 || "",
                        gstNumber: customer.gst || "",
                    },
                    summaryDetails: {
                        subTotal: totalAmount - totalGst,
                        totalGst: totalGst,
                        total: totalAmount,
                    },
                    invoiceDetails: {
                        invoiceNumber: invoiceNumber,
                        invoiceDate: moment().format("DD-MM-YYYY"),
                    },
                    transactions: transactions.map((txn: any) => ({
                        item: txn.remarks,
                        description: txn.remarks,
                        amount: txn.amount,
                        gst: txn.gst,
                    })),
                    totalAmount,
                    subTotal: totalAmount - totalGst,
                    totalGst,
                    startOfMonth:moment(startOfMonth).format("DD-MM-YYYY"),
                    endOfMonth:moment(endOfMonth).format("DD-MM-YYYY"),
                };
                await generateInvoicePDF(dataForPdf, pdfName);
            }
        } catch (err: any) {
            console.log(err);
            // return serverErrorHandler(
            //     err,
            //     res,
            //     err.message,
            //     HttpCodeEnum.SERVERERROR,
            //     {}
            // );
        }
    }
}
