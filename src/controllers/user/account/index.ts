import { Request, Response } from "express";
import { ValidationChain } from "express-validator";
import moment from "moment";
import { Customer, ReportIssues, Faqs, Setting, Wallet, Transaction, Invoice } from "../../../models";
import { removeObjectKeys, serverResponseHandler, serverResponse, serverErrorHandler, removeSpace, constructResponseMsg, serverInvalidRequest, groupByDate } from "../../../utils";
import { HttpCodeEnum } from "../../../enums/server";
import validate from "./validate";
import EmailService from "../../../utils/email";
import Logger from "../../../utils/logger";
import ServerMessages, { ServerMessagesEnum } from "../../../config/messages";
import mongoose from "mongoose";
import { prepareNotificationData, prepareWhatsAppNotificationData } from "../../../utils/notification-center";

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
            const {
                name,
                phone,
                designation,
                email,
                trade_name,
                leagal_name,
                gst,
                telephone,
                company_email,
                address_line_1,
                landmark,
                city,
                state,
                pincode,
                open_time,
                close_time,
                parent_id,
                whatapp_num,
                status,
            } = req.body;
            // let checkGSt: any = await Customer.countDocuments({gst:gst,_id: { $ne: req.customer.object_id }});
            // if(checkGSt > 0){
            //     return serverResponseHandler(res, HttpCodeEnum.OK,false, 'GST No already associated with another account', {});
            // }

            let result: any = await Customer.findOneAndUpdate(
                { id: req.customer.user_id },
                {
                    name: name,
                    email: email,
                    designation: designation,
                    trade_name: trade_name,
                    leagal_name: leagal_name,
                    // gst: gst,
                    telephone: telephone,
                    company_email: company_email,
                    address_line_1: address_line_1,
                    landmark: landmark,
                    city: city,
                    state: state,
                    pincode: pincode,
                    open_time: open_time,
                    close_time: close_time,
                    whatapp_num: whatapp_num,
                    status: status,
                }
            );
            const customerExistWithGstVerified: any = await Customer.find({
                gst: result?.gst,
                is_gst_verified: true,
            }).lean();
            const checkTransaction: any = await Transaction.findOne({ remarks: "REGISTRATIONTOPUP", customer_id: req.customer.object_id }).lean();
            const settings: any = await Setting.findOne({ key: "customer_settings" }).lean();
            const mainWallet: any = await Wallet.findOne({ customer_id: req.customer.object_id, type: 0 });

            if (!checkTransaction && customerExistWithGstVerified.length === 1) {
                const reachare: any = await Wallet.create({
                    balance: parseFloat(Number(settings.value.new_registration_topup).toFixed(2)),
                    type: 1,
                    customer_id: req.customer.object_id,
                });

                const notificationData = {
                    tmplt_name: "new_user_profile_complete",
                    to: req.customer.object_id,
                    dynamicKey: {
                        promo_amount: settings.value.new_registration_topup,
                    },
                };
                const whatsAppData = {
                    campaignName: "New User Profile Complete",
                    userName: customerExistWithGstVerified[0]?.name,
                    destination: customerExistWithGstVerified[0]?.whatapp_num || customerExistWithGstVerified[0]?.phone,
                    templateParams: [`${settings.value.new_registration_topup}` + ""],
                };

                prepareNotificationData(notificationData);
                prepareWhatsAppNotificationData(whatsAppData);

                const transaction: any = await Transaction.create({
                    amount: parseFloat(Number(settings.value.new_registration_topup).toFixed(2)),
                    gst: 0,
                    transaction_id: "",
                    transaction_type: 0,
                    razorpay_payment_id: "",
                    status: 1,
                    remarks: "REGISTRATIONTOPUP",
                    closing_balance: parseFloat((Number(mainWallet?.balance) || 0).toFixed(2)),
                    customer_id: req.customer.object_id,
                });
            }
            if (!mainWallet) {
                const result: any = await Wallet.create({
                    balance: 0,
                    type: 0,
                    customer_id: req.customer.object_id,
                });
            }
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
                created_by: req.customer.object_id,
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

            const results: any = await Faqs.find({ status: true }).select("id question answer").lean();

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

            const { amount, payment_id, remarks, error_code, transaction_id, status } = req.body;
            const mainWallet: any = await Wallet.findOne({ customer_id: req.customer.object_id, type: 0 });

            if (error_code) {
                const transaction: any = await Transaction.findOneAndUpdate(
                    { transaction_id: transaction_id },
                    {
                        amount: parseFloat(Number(amount).toFixed(2)),
                        transaction_id: transaction_id,
                        status: 2,
                        remarks: remarks,
                        error_code: error_code,
                        closing_balance: parseFloat((Number(mainWallet?.balance) || 0).toFixed(2)),
                        customer_id: req.customer.object_id,
                    }
                );
                return serverResponseHandler(res, HttpCodeEnum.OK, false, "Transaction Cancelled/Rejected", {});
            } else {
                const existing: any = await Wallet.findOne({ customer_id: req.customer.object_id, type: 0 }).lean();

                if (existing) {
                    const result: any = await Wallet.findOneAndUpdate(
                        { customer_id: req.customer.object_id, type: 0 },
                        {
                            balance: parseFloat((existing.balance + Number(amount)).toFixed(2)),
                        }
                    );
                } else {
                    const result: any = await Wallet.create({
                        balance: parseFloat(Number(amount).toFixed(2)),
                        type: 0,
                        customer_id: req.customer.object_id,
                    });
                }

                const transaction: any = await Transaction.findOneAndUpdate(
                    { transaction_id: transaction_id },
                    {
                        amount: parseFloat(Number(amount).toFixed(2)),
                        transaction_id: transaction_id,
                        razorpay_payment_id: payment_id,
                        remarks: "Amount added successful.",
                        closing_balance: parseFloat((Number(mainWallet?.balance) + Number(amount) || 0).toFixed(2)),
                        status: 1,
                        customer_id: req.customer.object_id,
                    }
                );

                const notificationData = { tmplt_name: "wallet_recharge", to: req.customer.object_id, dynamicKey: { amount: amount } };

                prepareNotificationData(notificationData);

                return serverResponse(res, HttpCodeEnum.OK, ServerMessages.errorMsgLocale(this.locale, ServerMessagesEnum["wallet-recharge-success"]), {});
            }
        } catch (err: any) {
            console.error(err);
            return serverErrorHandler(err, res, err.message, HttpCodeEnum.SERVERERROR, {});
        }
    }

    // Checked
    // public async getWalletBalance(req: Request, res: Response): Promise<any> {
    //     try {
    //         const fn = "[getById]";
    //         // Set locale
    //         const { locale } = req.query;
    //         this.locale = (locale as string) || "en";

    //         const results: any = await Wallet.findOne({ customer_id: req.customer.object_id }).select('id balance').lean();

    //         if (results) {
    //             return serverResponse(res, HttpCodeEnum.OK, ServerMessages.errorMsgLocale(this.locale, ServerMessagesEnum["wallet-balance-fetched"]), results);
    //         } else {
    //             throw new Error(ServerMessages.errorMsgLocale(this.locale, ServerMessagesEnum["not-found"]));
    //         }
    //     } catch (err: any) {
    //         return serverErrorHandler(err, res, err.message, HttpCodeEnum.SERVERERROR, {});
    //     }
    // }

    public async getWalletBalance(req: Request, res: Response): Promise<any> {
        try {
            const fn = "[getWalletBalance]";

            // Set locale
            const { locale } = req.query;
            this.locale = (locale as string) || "en";

            const customerId = req.customer.object_id;

            // Fetch both types
            const wallets: any = await Wallet.find({
                customer_id: customerId,
                type: { $in: [0, 1] },
            })
                .select("id balance type")
                .lean();

            // Prepare response
            let balance = 0;
            let promoBalance = 0;

            for (const wallet of wallets) {
                if (wallet.type === 0) balance = wallet.balance;
                if (wallet.type === 1) promoBalance = wallet.balance;
            }

            const response = {
                balance,
                promoBalance,
            };
            return serverResponse(res, HttpCodeEnum.OK, ServerMessages.errorMsgLocale(this.locale, ServerMessagesEnum["wallet-balance-fetched"]), response);
        } catch (err: any) {
            return serverErrorHandler(err, res, err.message, HttpCodeEnum.SERVERERROR, {});
        }
    }

    public async getTransactions(req: Request, res: Response): Promise<any> {
        try {
            const fn = "[getList]";
            const { locale, page, limit, search } = req.query;
            this.locale = (locale as string) || "en";

            const pageNumber = parseInt(page as string) || 1;
            const limitNumber = parseInt(limit as string) || 10;
            const skip = (pageNumber - 1) * limitNumber;
            const customerId = new mongoose.Types.ObjectId(req.customer.object_id);

            const result = await Transaction.aggregate([
                { $match: { customer_id: customerId, status: { $ne: 2 } } },
                { $sort: { id: -1 } },
                { $skip: skip },
                { $limit: limitNumber },
                {
                    $addFields: {
                        transaction_id: {
                            $cond: {
                                if: {
                                    $or: [{ $eq: ["$transaction_id", null] }, { $eq: ["$transaction_id", ""] }, { $eq: [{ $type: "$transaction_id" }, "missing"] }],
                                },
                                then: { $toString: "$_id" },
                                else: "$transaction_id",
                            },
                        },
                        created_date: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt", timezone: "Asia/Kolkata" } },
                        created_time: { $dateToString: { format: "%H:%M", date: "$createdAt", timezone: "Asia/Kolkata" } },
                    },
                },
            ]);

            const totalCount = await Transaction.countDocuments({ customer_id: customerId });

            if (result.length > 0) {
                const totalPages = Math.ceil(totalCount / limitNumber);
                return serverResponse(res, HttpCodeEnum.OK, ServerMessages.errorMsgLocale(this.locale, ServerMessagesEnum["transactions-fetched"]), { result, totalPages });
            } else {
                throw new Error(ServerMessages.errorMsgLocale(this.locale, ServerMessagesEnum["not-found"]));
            }
        } catch (err: any) {
            return serverErrorHandler(err, res, err.message, HttpCodeEnum.SERVERERROR, {});
        }
    }

    public async getInvoices(req: Request, res: Response): Promise<any> {
        try {
            const fn = "[getList]";
            // Set locale
            const { locale, page, limit, search } = req.query;
            this.locale = (locale as string) || "en";

            const pageNumber = parseInt(page as string) || 1;
            const limitNumber = parseInt(limit as string) || 10;

            const skip = (pageNumber - 1) * limitNumber;

            const result = await Invoice.find({ customer_id: req.customer.object_id }).sort({ id: -1 }).skip(skip).limit(limitNumber).lean();
            const formattedResults = result.map((item: any) => ({
                ...item,
                file: `${process.env.RESOURCE_URL}${item.file}`,
            }));
            // Get the total number of documents in the Permissions collection
            const totalCount = await Invoice.countDocuments({});

            if (result.length > 0) {
                const totalPages = Math.ceil(totalCount / limitNumber);
                return serverResponse(res, HttpCodeEnum.OK, ServerMessages.errorMsgLocale(this.locale, ServerMessagesEnum["transactions-fetched"]), {
                    results: formattedResults,
                    totalPages,
                });
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
                return serverResponse(res, HttpCodeEnum.OK, ServerMessages.errorMsgLocale(this.locale, ServerMessagesEnum["team-fetched"]), {
                    data: results,
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
            const existCustomer: any = await Customer.countDocuments({ phone: phone });
            if (existCustomer > 0) {
                return serverResponseHandler(res, HttpCodeEnum.OK, false, "Phone No already exists", {});
            }
            const result: any = await Customer.create({
                name: name,
                phone: phone,
                email: email,
                designation: designation,
                parent_id: req.customer.object_id,
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
                    updated_by: req.customer.object_id,
                }
            );
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
