import { Request, Response } from "express";

import moment from "moment";
import { Customer, Invoice, Offers, Transaction, User, Wallet } from "../../models";
import { HttpCodeEnum } from "../../enums/server";
import Logger from "../../utils/logger";
import { generateInvoicePDF } from "../../utils/generate-pdf/pdf";
import { serverResponse } from "../../utils";
import ServerMessages, { ServerMessagesEnum } from "../../config/messages";
import PromoTransaction from "../../models/promo-transaction";
import { prepareNotificationData } from "../../utils/notification-center";

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
            const now = moment().tz("Asia/Kolkata").toDate();
            const result = await Offers.updateMany(
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
        } catch (err: any) {
            // Handle error
            console.log(err, "err");
        }
    }

    public async offersExpiringSoon(): Promise<void> {
        try {
            const now = moment().tz("Asia/Kolkata").toDate();
            const in15 = moment(now).add(15, "minutes").toDate();
            const pipeline = [
                {
                    $addFields: {
                        publishDt: {
                            $dateFromString: {
                                dateString: "$publish_date",
                                format: "%Y-%m-%d %H:%M:%S",
                                timezone: "Asia/Kolkata",
                            },
                        },
                        // Parse offer_validity "HH:mm" into milliseconds and add to publishDt
                        expiryDt: {
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
                                            $multiply: [{ $toInt: { $arrayElemAt: [{ $split: ["$offer_validity", ":"] }, 0] } }, 60 * 60 * 1000],
                                        },
                                        {
                                            $multiply: [{ $toInt: { $arrayElemAt: [{ $split: ["$offer_validity", ":"] }, 1] } }, 60 * 1000],
                                        },
                                    ],
                                },
                            ],
                        },
                    },
                },
                {
                    $match: {
                        status: 1,
                        $expr: {
                            $and: [{ $gt: ["$expiryDt", now] }, { $lte: ["$expiryDt", in15] }],
                        },
                    },
                },
                {
                    $project: {
                        _id: 1,
                        title: 1,
                        publish_date: 1,
                        offer_validity: 1,
                        expiryDt: 1,
                    },
                },
            ];

            const expiringSoon = await Offers.aggregate(pipeline);

            if (!expiringSoon.length) {
                return;
            }

            expiringSoon.forEach((o: any) => {});
        } catch (err) {
            console.error("Error finding expiring offers:", err);
        }
    }

    public async generateInvoice(): Promise<any> {
        try {
            const fn = "[updateExpiredOffers]";
            const now = moment().toDate();

            const startOfMonth = moment().subtract(1, "month").startOf("month").toDate();
            const endOfMonth = moment().subtract(1, "month").endOf("month").toDate();

            const customers = await Customer.find({ is_gst_verified: true, is_deleted: true, status: 1 });

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
        } catch (err: any) {
            console.log(err);
        }
    }

    public async expirePromoAmount(): Promise<void> {
        const now = moment().tz("Asia/Kolkata").format("YYYY-MM-DD");
        try {

            const expiredPromos = await PromoTransaction.find({
                status: true,
                expiry_date: { $lt: now }, //lte
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
            const transactionsToInsert = [];
            for (const promo of expiredPromos) {
                const { customer_id, amount, remaining_balance } = promo;
                const wallet: any = await Wallet.findOne({ customer_id, type: 1 });
                const mainWallet: any = await Wallet.findOne({ customer_id, type: 0 });

                if (wallet) {
                    const newAmount = Math.max(0, wallet.balance - amount);
                    bulkWalletOps.push({
                        updateOne: {
                            filter: { _id: wallet._id },
                            update: { $set: { balance: parseFloat(Number(newAmount).toFixed(2)) } },
                        },
                    });
                    if (remaining_balance > 0) {
                        transactionsToInsert.push({
                            amount,
                            customer_id,
                            closing_balance: parseFloat((Number(mainWallet?.balance) || 0).toFixed(2)),
                            remaining_balance,
                            remarks: "CREDIT LAPSE",
                        });
                    }
                    // } else {
                    //     console.log(`Wallet not found for customer ${customer_id}`);
                }
            }
            if (bulkWalletOps.length) {
                await Wallet.bulkWrite(bulkWalletOps);
            }
            if (transactionsToInsert.length) {
                await Transaction.insertMany(transactionsToInsert);
            }
        } catch (err: any) {
            console.error("Error in expirePromos:", err.message);
        }
    }

    public async notifyPromoBeforeExpiry(): Promise<void> {
        try {
            const notifyDate = moment().tz("Asia/Kolkata").add(2, "days").format("YYYY-MM-DD");

            const promos = await PromoTransaction.aggregate([
                {
                    $match: {
                        status: true,
                        remaining_balance: { $gt: 0 },
                        expiry_date: notifyDate,
                        notify_before_expiry: false,
                    },
                },
                {
                    $group: {
                        _id: "$customer_id",
                        totalAmount: { $sum: "$remaining_balance" },
                        promoIds: { $push: "$_id" },
                    },
                },
            ]);

            for (const promo of promos) {
                const customer: any = await Customer.findOne({ _id: promo._id });

                if (!customer) continue;
                prepareNotificationData({
                    tmplt_name: "promo_expiring_soon",
                    to: customer?._id,
                    dynamicKey: {
                        amount: promo.totalAmount,
                        expiry_date: notifyDate,
                    },
                });
                await PromoTransaction.updateMany({ _id: { $in: promo.promoIds } }, { $set: { notify_before_expiry: true } });
            }
        } catch (err: any) {
            console.error("Promo before expiry notify error:", err.message);
        }
    }

    public async notifyPromoOnExpiry(): Promise<void> {
        try {
            const today = moment().tz("Asia/Kolkata").format("YYYY-MM-DD");
            const promos = await PromoTransaction.aggregate([
                {
                    $match: {
                        status: true,
                        remaining_balance: { $gt: 0 },
                        expiry_date: today,
                        notify_on_expiry: false,
                    },
                },
                {
                    $group: {
                        _id: "$customer_id",
                        totalAmount: { $sum: "$remaining_balance" },
                        promoIds: { $push: "$_id" },
                    },
                },
            ]);

            for (const promo of promos) {
                const customer: any = await Customer.findOne({ _id: promo._id });

                if (!customer) continue;

                prepareNotificationData({
                    tmplt_name: "promo_expired_today",
                    to: customer?._id,
                    dynamicKey: {
                        amount: promo.totalAmount,
                        expiry_date: today,
                    },
                });

                await PromoTransaction.updateMany({ _id: { $in: promo.promoIds } }, { $set: { notify_on_expiry: true } });
            }
        } catch (err: any) {
            console.error("Promo expiry notify error:", err.message);
        }
    }
}
