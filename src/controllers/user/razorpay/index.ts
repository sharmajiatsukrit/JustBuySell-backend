import { Request, Response } from "express";
import { ValidationChain } from "express-validator";
import moment from "moment";
import { Offers,Product,Rating,UnlockOffers,Transaction, Wallet } from "../../../models";
import { removeObjectKeys, serverResponse, serverErrorHandler, removeSpace, constructResponseMsg, serverInvalidRequest, groupByDate } from "../../../utils";
import { HttpCodeEnum } from "../../../enums/server";
import validate from "./validate";
import EmailService from "../../../utils/email";
import Logger from "../../../utils/logger";
import { RazorpayUtil } from "../../../utils/razorpay";
import ServerMessages, { ServerMessagesEnum } from "../../../config/messages";

const fileName = "[admin][razorpay][index.ts]";
export default class RazorpayController {
    public locale: string = "en";
    public emailService;

    constructor() {
        this.emailService = new EmailService();
    }

    public validate(endPoint: string): ValidationChain[] {
        return validate(endPoint);
    }

    //add
    public async createOrder(req: Request, res: Response): Promise<any> {
        try {
            const fn = "[createOrder]";
            const { locale } = req.query;
            this.locale = (locale as string) || "en";

            const { amount, currency } = req.body;
            const receipt = `rcpt_${Date.now()}`;
            
            const order:any = await RazorpayUtil.createOrder(amount * 100, "INR", receipt);
            if(order){
                const transaction: any = await Transaction.create({
                    amount: amount,
                    transaction_type: 0,
                    transaction_id: receipt,
                    razorpay_order_id: order.id,
                    razorpay_order_amount: order.amount,
                    status: 0,
                    customer_id: req.customer.object_id
                });
                const transactiondetails: any = await Transaction.findOne({transaction_id: receipt}).populate("customer_id").lean();
                // console.log();
            return serverResponse(res, HttpCodeEnum.OK, constructResponseMsg(this.locale, "offer-add"), transactiondetails);

            }
            
        } catch (err: any) {
            return serverErrorHandler(err, res, err.message, HttpCodeEnum.SERVERERROR, {});
        }
    }

    //add
    public async capturePayment(req: Request, res: Response): Promise<any> {
        try {
            const fn = "[capturePayment]";
            const { locale } = req.query;
            this.locale = (locale as string) || "en";

            const { payment_id, amount } = req.body;
            const result = await RazorpayUtil.capturePayment(payment_id, amount);
            // console.log(result);
            return serverResponse(res, HttpCodeEnum.OK, constructResponseMsg(this.locale, "offer-add"), result);
        } catch (err: any) {
            return serverErrorHandler(err, res, err.message, HttpCodeEnum.SERVERERROR, {});
        }
    }

    //add
    public async verifySignature(req: Request, res: Response): Promise<any> {
        try {
            const fn = "[verifySignature]";
            const { locale } = req.query;
            this.locale = (locale as string) || "en";

            const { order_id, payment_id, signature } = req.body;
            const body = `${order_id}|${payment_id}`;
            const isVerified = RazorpayUtil.verifySignature(body, signature);
            if (!isVerified) {
                return serverResponse(
                    res,
                    HttpCodeEnum.UNAUTHORIZED,
                    constructResponseMsg(this.locale, "signature-verification-failed"),
                    {}
                );
            }

            return serverResponse(
                res,
                HttpCodeEnum.OK,
                constructResponseMsg(this.locale, "signature-verified"),
                { order_id, payment_id }
            );


            // return serverResponse(res, HttpCodeEnum.OK, constructResponseMsg(this.locale, "offer-add"), result.doc);
        } catch (err: any) {
            return serverErrorHandler(err, res, err.message, HttpCodeEnum.SERVERERROR, {});
        }
    }

    
    
} 

