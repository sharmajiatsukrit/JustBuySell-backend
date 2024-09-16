import { Request, Response } from "express";
import { ValidationChain } from "express-validator";
import moment from "moment";
import { Customer, ReportIssues, Faqs, Setting, Wallet, Transaction } from "../../../models";
import { removeObjectKeys, serverResponse, serverErrorHandler, removeSpace, constructResponseMsg, serverInvalidRequest, groupByDate } from "../../../utils";
import { HttpCodeEnum } from "../../../enums/server";
import validate from "./validate";
import EmailService from "../../../utils/email";
import Logger from "../../../utils/logger";
import ServerMessages, { ServerMessagesEnum } from "../../../config/messages";


const fileName = "[user][account][index.ts]";
export default class AccountController {
    public locale: string = "en";
    public emailService;

    constructor() {
        this.emailService = new EmailService();
    }

    public validate(endPoint: string): ValidationChain[] {
        return validate(endPoint);
    }


    // Checked
    public async getMyProfile(req: Request, res: Response): Promise<any> {
        try {
            const fn = "[getById]";
            // Set locale
            const { locale } = req.query;
            this.locale = (locale as string) || "en";

            const results: any = await Customer.findOne({ _id: req.customer.object_id }).lean();
            if (results.company_logo.length) {

            }
            if (results) {
                return serverResponse(res, HttpCodeEnum.OK, ServerMessages.errorMsgLocale(this.locale, ServerMessagesEnum["customer-fetched"]), results);
            } else {
                throw new Error(ServerMessages.errorMsgLocale(this.locale, ServerMessagesEnum["not-found"]));
            }
        } catch (err: any) {
            return serverErrorHandler(err, res, err.message, HttpCodeEnum.SERVERERROR, {});
        }
    }

    public async updateMyProfile(req: Request, res: Response): Promise<any> {
        try {
            const fn = "[updateMyProfile]";

            // Set locale
            const { locale } = req.query;
            this.locale = (locale as string) || "en";
            const { name, phone, email, company_name, brand_name, gst, telephone, company_email, address_line_1, address_line_2, open_time, close_time, parent_id, status } = req.body;
            let result: any = await Customer.findOneAndUpdate(
                { id: req.customer.user_id },
                {
                    name: name,
                    email: email,
                    company_name: company_name,
                    brand_name: brand_name,
                    gst: gst,
                    telephone: telephone,
                    company_email: company_email,
                    address_line_1: address_line_1,
                    address_line_2: address_line_2,
                    open_time: open_time,
                    close_time: close_time,
                    status: status
                });

            console.log(result);
            let company_logo: any;
            if (req.file) {
                company_logo = req?.file?.filename;
                let resultimage: any = await Customer.findOneAndUpdate({ _id: req.customer.object_id }, { company_logo: company_logo });
            }
            const userData: any = await Customer.findOne({ _id: req.customer.object_id }).lean();

            return serverResponse(res, HttpCodeEnum.OK, constructResponseMsg(this.locale, "customer-updated"), userData);
        } catch (err: any) {
            return serverErrorHandler(err, res, err.message, HttpCodeEnum.SERVERERROR, {});
        }
    }

    public async ReportIssue(req: Request, res: Response): Promise<any> {
        try {
            const fn = "[add]";
            // Set locale
            const { locale } = req.query;
            this.locale = (locale as string) || "en";

            const { message } = req.body;

            const result: any = await ReportIssues.create({
                message: message,
                created_by: req.customer.object_id
            });

            if (result) {
                return serverResponse(res, HttpCodeEnum.OK, ServerMessages.errorMsgLocale(this.locale, ServerMessagesEnum["report-issue"]), {});
            } else {
                throw new Error(ServerMessages.errorMsgLocale(this.locale, ServerMessagesEnum["server-error"]));
            }
        } catch (err: any) {
            console.error(err);
            return serverErrorHandler(err, res, err.message, HttpCodeEnum.SERVERERROR, {});
        }
    }

    // Checked
    public async getHelpSupportDetails(req: Request, res: Response): Promise<any> {
        try {
            const fn = "[getById]";
            // Set locale
            const { locale } = req.query;
            this.locale = (locale as string) || "en";

            const results: any = await Setting.findOne({ id: 2 }).lean();

            if (results) {
                return serverResponse(res, HttpCodeEnum.OK, ServerMessages.errorMsgLocale(this.locale, ServerMessagesEnum["settings-fetched"]), results);
            } else {
                throw new Error(ServerMessages.errorMsgLocale(this.locale, ServerMessagesEnum["not-found"]));
            }
        } catch (err: any) {
            return serverErrorHandler(err, res, err.message, HttpCodeEnum.SERVERERROR, {});
        }
    }

    // Checked
    public async getHelpFaqs(req: Request, res: Response): Promise<any> {
        try {
            const fn = "[getById]";
            // Set locale
            const { locale } = req.query;
            this.locale = (locale as string) || "en";

            const results: any = await Faqs.find({ status: true }).select('id question answer').lean();

            if (results.length > 0) {
                return serverResponse(res, HttpCodeEnum.OK, ServerMessages.errorMsgLocale(this.locale, ServerMessagesEnum["faq-fetched"]), results);
            } else {
                throw new Error(ServerMessages.errorMsgLocale(this.locale, ServerMessagesEnum["not-found"]));
            }
        } catch (err: any) {
            return serverErrorHandler(err, res, err.message, HttpCodeEnum.SERVERERROR, {});
        }
    }


    public async rechargeWallet(req: Request, res: Response): Promise<any> {
        try {
            const fn = "[rechargeWallet]";
            // Set locale
            const { locale } = req.query;
            this.locale = (locale as string) || "en";

            const { amount, transaction_type, transaction_id, status } = req.body;

            const existing: any = await Wallet.findOne({ customer_id: req.customer.object_id }).lean();

            if (existing) {
                const result: any = await Wallet.findOneAndUpdate(
                    { customer_id: req.customer.object_id },
                    {
                        balance: existing.balance + amount,
                    });
            } else {
                const result: any = await Wallet.create({
                    balance: amount,
                    customer_id: req.customer.object_id
                });
            }
            const transaction: any = await Transaction.create({
                amount: amount,
                transaction_type: transaction_type,
                transaction_id: transaction_id,
                status: status,
                customer_id: req.customer.object_id
            });

            return serverResponse(res, HttpCodeEnum.OK, ServerMessages.errorMsgLocale(this.locale, ServerMessagesEnum["wallet-recharge-success"]), {});
        } catch (err: any) {
            console.error(err);
            return serverErrorHandler(err, res, err.message, HttpCodeEnum.SERVERERROR, {});
        }
    }

    // Checked
    public async getWalletBalance(req: Request, res: Response): Promise<any> {
        try {
            const fn = "[getById]";
            // Set locale
            const { locale } = req.query;
            this.locale = (locale as string) || "en";

            const results: any = await Wallet.findOne({ customer_id: req.customer.object_id }).select('id balance').lean();

            if (results) {
                return serverResponse(res, HttpCodeEnum.OK, ServerMessages.errorMsgLocale(this.locale, ServerMessagesEnum["wallet-balance-fetched"]), results);
            } else {
                throw new Error(ServerMessages.errorMsgLocale(this.locale, ServerMessagesEnum["not-found"]));
            }
        } catch (err: any) {
            return serverErrorHandler(err, res, err.message, HttpCodeEnum.SERVERERROR, {});
        }
    }

    // Checked
    public async getTransactions(req: Request, res: Response): Promise<any> {
        try {
            const fn = "[getList]";
            // Set locale
            const { locale, page, limit, search } = req.query;
            this.locale = (locale as string) || "en";

            const pageNumber = parseInt(page as string) || 1;
            const limitNumber = parseInt(limit as string) || 10;

            const skip = (pageNumber - 1) * limitNumber;

            const result = await Transaction.find({ customer_id: req.customer.object_id })
                .sort({ id: -1 })
                .skip(skip)
                .limit(limitNumber)
                .lean();

            // Get the total number of documents in the Permissions collection
            const totalCount = await Transaction.countDocuments({});

            if (result.length > 0) {
                const totalPages = Math.ceil(totalCount / limitNumber);
                return serverResponse(
                    res,
                    HttpCodeEnum.OK,
                    ServerMessages.errorMsgLocale(this.locale, ServerMessagesEnum["transactions-fetched"]),
                    { result, totalPages }
                );
            } else {
                throw new Error(ServerMessages.errorMsgLocale(this.locale, ServerMessagesEnum["not-found"]));
            }
        } catch (err: any) {
            return serverErrorHandler(err, res, err.message, HttpCodeEnum.SERVERERROR, {});
        }
    }

    // Checked
    public async getTeamMemberList(req: Request, res: Response): Promise<any> {
        try {
            const fn = "[getList]";
            // Set locale
            const { locale, page, limit, search } = req.query;
            this.locale = (locale as string) || "en";

            const pageNumber = parseInt(page as string) || 1;
            const limitNumber = parseInt(limit as string) || 10;
            const skip = (pageNumber - 1) * limitNumber;

            const results = await Customer.find({ parent_id: req.customer.object_id })
                .sort({ _id: -1 }) // Sort by _id in descending order
                .skip(skip)
                .limit(limitNumber)
                .lean();

            const totalCount = await Customer.countDocuments({ parent_id: req.customer.object_id });
            const totalPages = Math.ceil(totalCount / limitNumber);

            if (results.length > 0) {
                return serverResponse(res, HttpCodeEnum.OK, ServerMessages.errorMsgLocale(this.locale, ServerMessagesEnum["team-fetched"]), { data: results, totalCount, totalPages, currentPage: pageNumber });
            } else {
                throw new Error(ServerMessages.errorMsgLocale(this.locale, ServerMessagesEnum["not-found"]));
            }
        } catch (err: any) {
            return serverErrorHandler(err, res, err.message, HttpCodeEnum.SERVERERROR, {});
        }
    }
    // Checked
    public async getTeamMemberById(req: Request, res: Response): Promise<any> {
        try {
            const fn = "[getById]";
            // Set locale
            const { locale } = req.query;
            this.locale = (locale as string) || "en";

            const id = parseInt(req.params.id);
            const result: any = await Customer.findOne({ id: id }).lean();


            if (result) {
                return serverResponse(res, HttpCodeEnum.OK, ServerMessages.errorMsgLocale(this.locale, ServerMessagesEnum["team-fetched"]), result);
            } else {
                throw new Error(ServerMessages.errorMsgLocale(this.locale, ServerMessagesEnum["not-found"]));
            }
        } catch (err: any) {
            return serverErrorHandler(err, res, err.message, HttpCodeEnum.SERVERERROR, {});
        }
    }
    public async addTeamMember(req: Request, res: Response): Promise<any> {
        try {
            const fn = "[add]";
            // Set locale
            const { locale } = req.query;
            this.locale = (locale as string) || "en";

            const { name, phone, email, designation } = req.body;

            const result: any = await Customer.create({
                name: name,
                phone: phone,
                email: email,
                designation: designation,
                parent_id: req.customer.object_id
            });

            if (result) {
                return serverResponse(res, HttpCodeEnum.OK, ServerMessages.errorMsgLocale(this.locale, ServerMessagesEnum["team-add"]), {});
            } else {
                throw new Error(ServerMessages.errorMsgLocale(this.locale, ServerMessagesEnum["server-error"]));
            }
        } catch (err: any) {
            console.error(err);
            return serverErrorHandler(err, res, err.message, HttpCodeEnum.SERVERERROR, {});
        }
    }

    public async updateTeamMember(req: Request, res: Response): Promise<any> {
        try {
            const fn = "[update]";
            // Set locale
            const { locale } = req.query;
            this.locale = (locale as string) || "en";

            const { id } = req.params; // Assuming the ID is passed as a URL parameter
            const { name, phone, email, designation } = req.body;
            let result: any = await Customer.findOneAndUpdate(
                { id: id },
                {
                    name: name,
                    phone: phone,
                    email: email,
                    designation: designation,
                    updated_by: req.customer.object_id
                });
            // const watchlist = await Watchlist.find({ id });

            // watchlist[0].name = name;
            // await watchlist[0].save();

            return serverResponse(res, HttpCodeEnum.OK, ServerMessages.errorMsgLocale(this.locale, ServerMessagesEnum["team-update"]), {});
        } catch (err: any) {
            console.error(err);
            return serverErrorHandler(err, res, err.message, HttpCodeEnum.SERVERERROR, {});
        }
    }

    public async deleteTeamMember(req: Request, res: Response): Promise<any> {
        try {
            const fn = "[delete]";
            // Set locale
            const { locale } = req.query;
            this.locale = (locale as string) || "en";

            // Log the id for debugging purposes

            const id = parseInt(req.params.id);
            const result = await Customer.deleteOne({ id: id });

            if (result) {
                return serverResponse(res, HttpCodeEnum.OK, ServerMessages.errorMsgLocale(this.locale, ServerMessagesEnum["team-delete"]), result);
            } else {
                throw new Error(ServerMessages.errorMsgLocale(this.locale, ServerMessagesEnum["not-found"]));
            }

        } catch (err: any) {
            return serverErrorHandler(err, res, err.message, HttpCodeEnum.SERVERERROR, {});
        }
    }
}