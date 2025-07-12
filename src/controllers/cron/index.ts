import { Request, Response } from "express";

import moment from "moment";
import { Customer, Invoice, Offers, Transaction, User } from "../../models";
import { HttpCodeEnum } from "../../enums/server";
import Logger from "../../utils/logger";

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
            const filter:any = {};
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
                            60 * 60 * 1000 // Convert hours to ms
                        ]
                        }
                    ]
                    },
                    now
                ]
                }
            },
            {
                $set: { status: 0 } // or 'expired' depending on your schema
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
            const filter:any = {};
            const now = moment().toDate();
            

            const startOfMonth = moment().startOf('month').toDate();
            const endOfMonth = moment().endOf('month').toDate();

            const customers = await Customer.find({is_gst_verified:true,status:1});

            for (const customer of customers) {
                const transactions = await Transaction.find({
                customer_id: customer._id,
                createdAt: { $gte: startOfMonth, $lte: endOfMonth },
                });

                if (transactions.length === 0) continue;

                const totalAmount = transactions.reduce((sum, txn) => sum + txn.amount, 0);
                const totalGst = transactions.reduce((sum, txn) => sum + txn.gst, 0);

                const invoice = new Invoice({
                customerId: customer._id,
                customerName: customer.name,
                gstNumber: customer.gst,
                invoiceMonth: moment().format('YYYY-MM'),
                transactions: transactions.map(txn => txn._id),
                totalAmount,
                totalGst,
                createdAt: new Date(),
                });

                await invoice.save();
            }

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

    
}