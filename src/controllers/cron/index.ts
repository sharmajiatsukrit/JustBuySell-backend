import { Request, Response } from "express";

import moment from "moment";
import { Offers, User } from "../../models";
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

    
}