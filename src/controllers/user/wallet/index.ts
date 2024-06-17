import { Request, Response } from "express";
import { ValidationChain } from "express-validator";
import moment from "moment";
import { Category, Product, ProductRequest, Wallet, TransctionHistory, User } from "../../../models";
import { removeObjectKeys, serverResponse, serverErrorHandler, removeSpace, constructResponseMsg, serverInvalidRequest, groupByDate } from "../../../utils";
import { HttpCodeEnum } from "../../../enums/server";
import validate from "./validate";
import EmailService from "../../../utils/email";
import Logger from "../../../utils/logger";
import ServerMessages, { ServerMessagesEnum } from "../../../config/messages";
import jwt from 'jsonwebtoken';


const fileName = "[user][wallet][index.ts]";
export default class Productcontroller {
    public locale: string = "en";
    public emailService;

    constructor() {
        this.emailService = new EmailService();
    }

    public validate(endPoint: string): ValidationChain[] {
        return validate(endPoint);
    }

    public async addWallet(req: Request, res: Response): Promise<any> {
        try {
            const fn = "[addWallet]";
            // Set locale
            const { locale } = req.query;
            this.locale = (locale as string) || "en";

            const { wallet } = req.body;

            // Extract userid from req.user
            const { user_id: userid } = req.user;

            // Generate dynamic transactionid
            const minNo = 100000000;
            const maxNo = 999999999;
            const trnid = Math.floor(Math.random() * (maxNo - minNo + 1)) + minNo;
            console.log(`${fn} - Generated trnid: ${trnid}`);

            // Create wallet entry
            const walletadd = await Wallet.create({ wallet, userid });
            console.log(`${fn} - Wallet created with userid: ${userid}`);

            // Create transaction history entry
            const transctionid = await TransctionHistory.create({ amount: wallet, userid, trnid, type: 0 });

            return serverResponse(res, HttpCodeEnum.OK, ServerMessages.errorMsgLocale(this.locale, ServerMessagesEnum["category-fetched"]), {});
        } catch (err: any) {
            return serverErrorHandler(err, res, err.message, HttpCodeEnum.SERVERERROR, {});
        }
    }

    public async getList(req: Request, res: Response): Promise<any> {
        try {
            const fn = "[getList]";
            // Set locale
            const { locale } = req.query;
            this.locale = (locale as string) || "en";

            const result = await Wallet.find({}).sort([['id', 'desc']]).lean();

            if (result.length > 0) {
                return serverResponse(res, HttpCodeEnum.OK, ServerMessages.errorMsgLocale(this.locale, ServerMessagesEnum["category-fetched"]), result);
            } else {
                throw new Error(ServerMessages.errorMsgLocale(this.locale, ServerMessagesEnum["not-found"]));
            }
        } catch (err: any) {
            return serverErrorHandler(err, res, err.message, HttpCodeEnum.SERVERERROR, {});
        }
    }

    public async getByid(req: Request, res: Response): Promise<any> {
        try {
            const fn = "[getByid]";
            // Set locale
            const { locale } = req.query;
            this.locale = (locale as string) || "en";

            // Extract userid from req.user
            const { user_id: userid } = req.user;

            const result = await Wallet.find({ userid });

            if (result.length > 0) {
                const filteredResult = result.map(wallet => ({
                    id: wallet.id,
                    wallet: wallet.wallet,
                    userid: wallet.userid,
                    status: wallet.status,
                    createdBy: wallet.created_by,
                    updatedBy: wallet.updated_by
                }));
                return serverResponse(res, HttpCodeEnum.OK, ServerMessages.errorMsgLocale(this.locale, ServerMessagesEnum["category-fetched"]), filteredResult);
            } else {
                throw new Error(ServerMessages.errorMsgLocale(this.locale, ServerMessagesEnum["not-found"]));
            }
        } catch (err: any) {
            return serverErrorHandler(err, res, err.message, HttpCodeEnum.SERVERERROR, {});
        }
    }

    public async getTransbyid(req: Request, res: Response): Promise<any> {
        try {
            const fn = "[getByid]";
            // Set locale
            const { locale } = req.query;
            this.locale = (locale as string) || "en";

            // Extract userid from req.user
            const { user_id: userid } = req.user;
            const { type } = req.params;

            if (type === "2") {
                const result = await TransctionHistory.find({ userid });

                if (result.length > 0) {
                    const filteredResult = result.map(wallet => ({
                        id: wallet.id,
                        amount: wallet.amount,
                        userid: wallet.userid,
                        trnid: wallet.trnid,
                        status: wallet.status,
                        createdBy: wallet.created_by,
                        updatedBy: wallet.updated_by
                    }));
                    return serverResponse(res, HttpCodeEnum.OK, ServerMessages.errorMsgLocale(this.locale, ServerMessagesEnum["category-fetched"]), filteredResult);
                } else {
                    throw new Error(ServerMessages.errorMsgLocale(this.locale, ServerMessagesEnum["not-found"]));
                }
            }
            else {
                const result = await TransctionHistory.find({ userid, type });

                if (result.length > 0) {
                    const filteredResult = result.map(wallet => ({
                        id: wallet.id,
                        amount: wallet.amount,
                        userid: wallet.userid,
                        trnid: wallet.trnid,
                        type: wallet.type,
                        status: wallet.status,
                        createdBy: wallet.created_by,
                        updatedBy: wallet.updated_by
                    }));
                    return serverResponse(res, HttpCodeEnum.OK, ServerMessages.errorMsgLocale(this.locale, ServerMessagesEnum["category-fetched"]), filteredResult);
                } else {
                    throw new Error(ServerMessages.errorMsgLocale(this.locale, ServerMessagesEnum["not-found"]));
                }
            }


        } catch (err: any) {
            return serverErrorHandler(err, res, err.message, HttpCodeEnum.SERVERERROR, {});
        }
    }

}