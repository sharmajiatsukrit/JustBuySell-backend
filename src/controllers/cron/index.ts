import { Request, Response } from "express";

import moment from "moment";
import { Customer, Invoice, Offers, Transaction, User, Wallet } from "../../models";
import { HttpCodeEnum } from "../../enums/server";
import Logger from "../../utils/logger";
import { generateInvoicePDF } from "../../utils/generate-pdf/pdf";
import { serverResponse } from "../../utils";
import ServerMessages, { ServerMessagesEnum } from "../../config/messages";
import PromoTransaction from "../../models/promo-transaction";

const fileName = "[admin][cron][index.ts]";
export default class CronController {
    public locale: string = "en";
    // public emailService;

    constructor() {
        // this.emailService = new EmailService();
    }

    // Checked
    public async updateExpiredOffers(): Promise<any> {
        console.log("hello");
        try {
            const fn = "[updateExpiredOffers]";
            const filter: any = {};
            const now = moment().tz("Asia/Kolkata").toDate();
            console.log(now, moment().toDate());

            await Offers.updateMany(
                {
                    status: 1,
                    $expr: {
                        $lte: [
                            {
                                $add: [
                                    {
                                        $dateFromString: {
                                            dateString: "$publish_date",
                                            format: "%Y-%m-%d %H:%M:%S",
                                            timezone: "Asia/Kolkata",
                                        },
                                    },
                                    {
                                        $add: [
                                            {
                                                $multiply: [
                                                    {
                                                        $toInt: {
                                                            $arrayElemAt: [{ $split: ["$offer_validity", ":"] }, 0],
                                                        },
                                                    },
                                                    60 * 60 * 1000, // hours → ms
                                                ],
                                            },
                                            {
                                                $multiply: [
                                                    {
                                                        $toInt: {
                                                            $arrayElemAt: [{ $split: ["$offer_validity", ":"] }, 1],
                                                        },
                                                    },
                                                    60 * 1000, // minutes → ms
                                                ],
                                            },
                                        ],
                                    },
                                ],
                            },
                            now,
                        ],
                    },
                },
                {
                    $set: { status: 0 },
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
            console.log(moment().toDate());
            const customers = await Customer.find({ id: 163, is_gst_verified: true, status: 1 });

            for (const customer of customers) {
                const transactions = await Transaction.find({
                    customer_id: customer._id,
                    transaction_type: 1,
                    status: 1,
                    createdAt: { $gte: startOfMonth, $lte: endOfMonth },
                });
                console.log(transactions);
                if (transactions.length === 0) continue;
                const totalAmount = transactions.reduce((sum, txn) => sum + txn.amount, 0);
                const totalGst = transactions.reduce((sum, txn) => sum + txn.gst, 0);
                const sameState = customer?.gst?.substring(0, 2) === "07AAOCS3727K1ZV"?.substring(0, 2);
                const invoice = new Invoice({
                    customerId: customer._id,
                    customerName: customer.name,
                    gst: totalGst,
                    start_date: moment(startOfMonth).format("YYYY-MM-DD"),
                    end_date: moment(endOfMonth).format("YYYY-MM-DD"),
                    month: moment(startOfMonth).format("MM"),
                    year: moment(startOfMonth).format("YYYY"),
                    transactions: transactions.map((txn) => txn._id),
                    amount: totalAmount,
                });

                await invoice.save();
                const serialNumber = String(invoice.id).padStart(6, "0");
                const pdfName = `JBSINV${serialNumber}.pdf`;
                const invoiceNumber = `JBSINV${serialNumber}`;
                const savedInvoiceData = await Invoice.findOneAndUpdate({ id: invoice.id }, { file: pdfName, invoice_number: invoiceNumber });

                const dataForPdf = {
                    userDetails: {
                        name: customer.name,
                        company: customer.trade_name || "",
                        address1: customer.address_line_1 || "",
                        landmark: customer.landmark || "",
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
                    transactions: transactions.map((txn: any, index) => ({
                        item: index + 1,
                        description: txn.remarks,
                        amount: txn.amount,
                        dateOfTxn: moment(txn.createdAt).utcOffset("+05:30").format("DD-MM-YYYY"),
                        gst: txn.gst,
                        igst: txn.igst,
                        cgst: txn.cgst,
                        sgst: txn.sgst,
                        discount: txn.discount,
                        commission: txn.commission,
                        offer_price: txn.offer_price,
                        particular: txn.particular,
                    })),
                    totalAmount,
                    subTotal: totalAmount - totalGst,
                    gstLabel:sameState?`GST(18%) (IGST:9%, SGST:9%)`:"",
                    totalGst,
                    startOfMonth: moment(startOfMonth).format("DD-MM-YYYY"),
                    endOfMonth: moment(endOfMonth).format("DD-MM-YYYY"),
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

    public async expirePromoAmount(): Promise<void> {
        const now = moment().tz("Asia/Kolkata").format("YYYY-MM-DD");
        try {
            const expiredPromos = await PromoTransaction.find({
                status: true,
                expiry_date: { $lt: now }, //lte for test on same date
            });
            if (expiredPromos.length === 0) return;

            await PromoTransaction.updateMany(
                {
                    _id: { $in: expiredPromos.map((p) => p._id) },
                },
                {
                    $set: { status: false },
                }
            );

            const bulkWalletOps = [];

            for (const promo of expiredPromos) {
                const { customer_id, amount } = promo;
                const wallet: any = await Wallet.findOne({ customer_id, type: 1 }); //type 1 means promo wallet

                if (wallet) {
                    const newAmount = Math.max(0, wallet.balance - amount);
                    bulkWalletOps.push({
                        updateOne: {
                            filter: { _id: wallet._id },
                            update: { $set: { balance: newAmount } },
                        },
                    });
                } else {
                    console.log(`Wallet not found for customer ${customer_id}`);
                }
            }
            if (bulkWalletOps.length) {
                await Wallet.bulkWrite(bulkWalletOps);
            }
        } catch (err: any) {
            console.error("Error in expirePromos:", err.message);
        }
    }
}
