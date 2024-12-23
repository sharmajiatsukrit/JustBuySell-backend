import { Request, Response } from "express";
import { ValidationChain } from "express-validator";
import moment from "moment";
import { Category, Unit, Country, State, City, Roles, Attribute, AttributeItem } from "../../../models";
import { removeObjectKeys, serverResponse, serverErrorHandler, removeSpace, constructResponseMsg, serverInvalidRequest, groupByDate } from "../../../utils";
import { HttpCodeEnum } from "../../../enums/server";
import validate from "./validate";
import EmailService from "../../../utils/email";
import Logger from "../../../utils/logger";
import ServerMessages, { ServerMessagesEnum } from "../../../config/messages";

const fileName = "[admin][helper][index.ts]";
export default class HelperController {
    public locale: string = "en";
    public emailService;

    constructor() {
        this.emailService = new EmailService();
    }

    public validate(endPoint: string): ValidationChain[] {
        return validate(endPoint);
    }



    // Checked
    public async getCategories(req: Request, res: Response): Promise<any> {
        try {
            const fn = "[getCategories]";
            const { locale, page, limit, search } = req.query;
            this.locale = (locale as string) || "en";
            // Constructing the search query
            let searchQuery = {};
            if (search) {
                searchQuery = {
                    status: true,
                    $or: [
                        { name: { $regex: search, $options: 'i' } } // Case-insensitive search for name
                    ]
                };
            } else {
                searchQuery = { status: true, };
            }
            const result: any = await Category.find(searchQuery).select('id name').limit(10).sort({ id: -1 }).lean();
            console.log(result);
            if (result.length > 0) {
                return serverResponse(res, HttpCodeEnum.OK, constructResponseMsg(this.locale, "category-fetched"), result);
            } else {
                throw new Error(
                    ServerMessages.errorMsgLocale(
                        this.locale,
                        ServerMessagesEnum["not-found"]
                    )
                );
            }
        } catch (err: any) {
            return serverErrorHandler(
                err,
                res,
                err.message,
                HttpCodeEnum.SERVERERROR,
                []
            );
        }
    }


    public async getUnits(req: Request, res: Response): Promise<any> {
        try {
            const fn = "[getUnits]";
            // Set locale
            const { locale } = req.query;
            this.locale = (locale as string) || "en";


            const result = await Unit.find({ status: true }).sort([['id', 'desc']]).select('id name').lean();

            if (result.length > 0) {
                return serverResponse(res, HttpCodeEnum.OK, ServerMessages.errorMsgLocale(this.locale, ServerMessagesEnum["unit-fetched"]), result);
            } else {
                throw new Error(ServerMessages.errorMsgLocale(this.locale, ServerMessagesEnum["not-found"]));
            }
        } catch (err: any) {
            return serverErrorHandler(err, res, err.message, HttpCodeEnum.SERVERERROR, {});
        }
    }



    // Checked
    public async getAttributes(req: Request, res: Response): Promise<any> {
        try {
            const fn = "[getAttributes]";
            const { locale, page, limit, search } = req.query;
            this.locale = (locale as string) || "en";
            // Constructing the search query
            let searchQuery = {};
            if (search) {
                searchQuery = {
                    status: true,
                    $or: [
                        { name: { $regex: search, $options: 'i' } } // Case-insensitive search for name
                    ]
                };
            } else {
                searchQuery = { status: true, };
            }
            const result: any = await Attribute.find(searchQuery).select('id name').limit(10).sort({ id: -1 }).lean();
            console.log(result);
            if (result.length > 0) {
                return serverResponse(res, HttpCodeEnum.OK, constructResponseMsg(this.locale, "attribute-fetched"), result);
            } else {
                throw new Error(
                    ServerMessages.errorMsgLocale(
                        this.locale,
                        ServerMessagesEnum["not-found"]
                    )
                );
            }
        } catch (err: any) {
            return serverErrorHandler(
                err,
                res,
                err.message,
                HttpCodeEnum.SERVERERROR,
                []
            );
        }
    }

    // Checked
    public async getAttributeItems(req: Request, res: Response): Promise<any> {
        try {
            const fn = "[getAttributeItems]";
            const { locale, page, limit, search } = req.query;
            this.locale = (locale as string) || "en";
            // Constructing the search query
            const attribute_id = parseInt(req.params.attribute_id);
            const attribute: any = await Attribute.findOne({ id: attribute_id }).lean();
            let searchQuery = {};
            if (search) {
                searchQuery = {
                    attribute_id:attribute._id,
                    status: true,
                    $or: [
                        { name: { $regex: search, $options: 'i' } } // Case-insensitive search for name
                    ]
                };
            } else {
                searchQuery = { attribute_id:attribute._id,status: true, };
            }
            const result: any = await AttributeItem.find(searchQuery).select('id name').limit(10).sort({ id: -1 }).lean();
            console.log(result);
            if (result.length > 0) {
                return serverResponse(res, HttpCodeEnum.OK, constructResponseMsg(this.locale, "attribute-item-fetched"), result);
            } else {
                throw new Error(
                    ServerMessages.errorMsgLocale(
                        this.locale,
                        ServerMessagesEnum["not-found"]
                    )
                );
            }
        } catch (err: any) {
            return serverErrorHandler(
                err,
                res,
                err.message,
                HttpCodeEnum.SERVERERROR,
                []
            );
        }
    }

    // Checked
    public async getAttributeItemsByKey(req: Request, res: Response): Promise<any> {
        try {
            const fn = "[getAttributeItems]";
            const { locale, page, limit, search } = req.query;
            this.locale = (locale as string) || "en";
            // Constructing the search query
            const attribute_id = req.params.attribute_key;
            const attribute: any = await Attribute.findOne({ name: attribute_id }).lean();
            let searchQuery = {};
            if (search) {
                searchQuery = {
                    attribute_id:attribute._id,
                    status: true,
                    $or: [
                        { name: { $regex: search, $options: 'i' } } // Case-insensitive search for name
                    ]
                };
            } else {
                searchQuery = { attribute_id:attribute._id,status: true, };
            }
            const result: any = await AttributeItem.find(searchQuery).select('id name').limit(10).sort({ id: -1 }).lean();
            console.log(result);
            if (result.length > 0) {
                return serverResponse(res, HttpCodeEnum.OK, constructResponseMsg(this.locale, "attribute-item-fetched"), result);
            } else {
                throw new Error(
                    ServerMessages.errorMsgLocale(
                        this.locale,
                        ServerMessagesEnum["not-found"]
                    )
                );
            }
        } catch (err: any) {
            return serverErrorHandler(
                err,
                res,
                err.message,
                HttpCodeEnum.SERVERERROR,
                []
            );
        }
    }

    public async getCounties(req: Request, res: Response): Promise<any> {
        try {
            const fn = "[getCounties]";
            // Set locale
            const { locale } = req.query;
            this.locale = (locale as string) || "en";


            const result = await Country.find({}).where('status').equals(true).sort([['id', 'desc']]).select('id name').lean();

            if (result.length > 0) {
                return serverResponse(res, HttpCodeEnum.OK, ServerMessages.errorMsgLocale(this.locale, ServerMessagesEnum["country-fetched"]), result);
            } else {
                throw new Error(ServerMessages.errorMsgLocale(this.locale, ServerMessagesEnum["not-found"]));
            }
        } catch (err: any) {
            return serverErrorHandler(err, res, err.message, HttpCodeEnum.SERVERERROR, {});
        }
    }

    public async getStates(req: Request, res: Response): Promise<any> {
        try {
            const fn = "[getStates]";
            // Set locale
            const { locale } = req.query;
            this.locale = (locale as string) || "en";


            const result = await State.find({}).where('status').equals(true).sort([['id', 'desc']]).select('id name').lean();

            if (result.length > 0) {
                return serverResponse(res, HttpCodeEnum.OK, ServerMessages.errorMsgLocale(this.locale, ServerMessagesEnum["state-fetched"]), result);
            } else {
                throw new Error(ServerMessages.errorMsgLocale(this.locale, ServerMessagesEnum["not-found"]));
            }
        } catch (err: any) {
            return serverErrorHandler(err, res, err.message, HttpCodeEnum.SERVERERROR, {});
        }
    }

    public async getCities(req: Request, res: Response): Promise<any> {
        try {
            const fn = "[getCities]";
            // Set locale
            const { locale } = req.query;
            this.locale = (locale as string) || "en";


            const result = await City.find({}).where('status').equals(true).sort([['id', 'desc']]).select('id name').lean();

            if (result.length > 0) {
                return serverResponse(res, HttpCodeEnum.OK, ServerMessages.errorMsgLocale(this.locale, ServerMessagesEnum["city-fetched"]), result);
            } else {
                throw new Error(ServerMessages.errorMsgLocale(this.locale, ServerMessagesEnum["not-found"]));
            }
        } catch (err: any) {
            return serverErrorHandler(err, res, err.message, HttpCodeEnum.SERVERERROR, {});
        }
    }


    public async getRoles(req: Request, res: Response): Promise<any> {
        try {
            const fn = "[getRoles]";
            // Set locale
            const { locale } = req.query;
            this.locale = (locale as string) || "en";


            const result = await Roles.find({}).where('status').equals(true).sort([['id', 'desc']]).select('id name').lean();

            if (result.length > 0) {
                return serverResponse(res, HttpCodeEnum.OK, ServerMessages.errorMsgLocale(this.locale, ServerMessagesEnum["role-fetched"]), result);
            } else {
                throw new Error(ServerMessages.errorMsgLocale(this.locale, ServerMessagesEnum["not-found"]));
            }
        } catch (err: any) {
            return serverErrorHandler(err, res, err.message, HttpCodeEnum.SERVERERROR, {});
        }
    }
}