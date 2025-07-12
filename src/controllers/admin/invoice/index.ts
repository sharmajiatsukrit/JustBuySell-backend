import { Request, Response } from "express";
import { ValidationChain } from "express-validator";
import moment from "moment";
import { Invoice,Customer } from "../../../models";
import { removeObjectKeys, serverResponse, serverErrorHandler, removeSpace, constructResponseMsg, serverInvalidRequest, groupByDate } from "../../../utils";
import { HttpCodeEnum } from "../../../enums/server";
import validate from "./validate";
import EmailService from "../../../utils/email";
import Logger from "../../../utils/logger";
import ServerMessages, { ServerMessagesEnum } from "../../../config/messages";

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
            const { locale, page, limit, search,customer_id,start_date,end_date } = req.query;
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
    public async getById(req: Request, res: Response): Promise<any> {
        try {
            const fn = "[getById]";
            // Set locale
            const { locale } = req.query;
            this.locale = (locale as string) || "en";

            const id = parseInt(req.params.id);
            const result: any = await Invoice.findOne({ id: id }).lean();
            // console.log(result);

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

    

}