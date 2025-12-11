import { Request, Response } from "express";
import { ValidationChain } from "express-validator";
import moment from "moment";
import { Customer,Category, Unit, Country, State, City, Roles, Attribute, AttributeItem, Product, ProductRequest } from "../../../models";
import { removeObjectKeys, serverResponse, serverErrorHandler, removeSpace, constructResponseMsg, serverInvalidRequest, groupByDate } from "../../../utils";
import { HttpCodeEnum } from "../../../enums/server";
import validate from "./validate";
import EmailService from "../../../utils/email";
import Logger from "../../../utils/logger";
import ServerMessages, { ServerMessagesEnum } from "../../../config/messages";
import { generateInvoicePDF } from "../../../utils/generate-pdf/pdf";


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
            // const result: any = await Category.find(searchQuery).select('id name').limit(10).sort({ id: -1 }).lean();
            const result: any = await Category.aggregate([
                {
                  $lookup: {
                    from: "categories",
                    localField: "_id",
                    foreignField: "parent_id",
                    as: "children",
                  },
                },
                {
                  $match: { children: { $size: 0 }, ...searchQuery }, // Get only last child categories
                },
                {
                  $project: {
                    id: 1,
                    name: 1,
                  },
                },
                {
                  $sort: { id: -1 }, // Sorting based on ID
                },
                {
                  $limit: 10,
                },
              ]);
           
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

    // Checked
    public async getCatCategories(req: Request, res: Response): Promise<any> {
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
            const result: any = await Category.find(searchQuery).select('id name').limit(10).sort({ id: -1 }).lean();
            
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

    public async getCustomers(req: Request, res: Response): Promise<any> {
        try {
            const fn = "[getCustomers]";
            // Set locale
            const { locale } = req.query;
            this.locale = (locale as string) || "en";


            const result = await Customer.find({is_gst_verified:true,status:1}).sort([['id', 'desc']]).select('id name').lean();

            if (result.length > 0) {
                return serverResponse(res, HttpCodeEnum.OK, ServerMessages.errorMsgLocale(this.locale, ServerMessagesEnum["role-fetched"]), result);
            } else {
                throw new Error(ServerMessages.errorMsgLocale(this.locale, ServerMessagesEnum["not-found"]));
            }
        } catch (err: any) {
            return serverErrorHandler(err, res, err.message, HttpCodeEnum.SERVERERROR, {});
        }
    }
        public async getPendingProductRequestCount(req: Request, res: Response): Promise<any> {
        try {
            const fn = "[getCustomers]";
            // Set locale
            const { locale } = req.query;
            
            this.locale = (locale as string) || "en";

            const products = await ProductRequest.countDocuments({status:0});
            const totals = {
                total_pending_products_request:products,
            }
            if (totals) {
                return serverResponse(res, HttpCodeEnum.OK, ServerMessages.errorMsgLocale(this.locale, ServerMessagesEnum["role-fetched"]), totals);
            } else {
                throw new Error(ServerMessages.errorMsgLocale(this.locale, ServerMessagesEnum["not-found"]));
            }
        } catch (err: any) {
            return serverErrorHandler(err, res, err.message, HttpCodeEnum.SERVERERROR, {});
        }
    }

    public async getDashboardTotals(req: Request, res: Response): Promise<any> {
        try {
            const fn = "[getCustomers]";
            // Set locale
            const { locale } = req.query;
            this.locale = (locale as string) || "en";


            const customers = await Customer.countDocuments({is_deleted:false});
            const categories = await Category.countDocuments({is_deleted:false});
            const products = await Product.countDocuments({is_deleted:false});
            const totals = {
                total_customer:customers,
                total_categories:categories,
                total_products:products,
                total_buying_offers:products,
                total_selling_offers:products,
                total_earnings:products,
            }
            if (totals) {
                return serverResponse(res, HttpCodeEnum.OK, ServerMessages.errorMsgLocale(this.locale, ServerMessagesEnum["role-fetched"]), totals);
            } else {
                throw new Error(ServerMessages.errorMsgLocale(this.locale, ServerMessagesEnum["not-found"]));
            }
        } catch (err: any) {
            return serverErrorHandler(err, res, err.message, HttpCodeEnum.SERVERERROR, {});
        }
    }


        public async getTestPDf(req: Request, res: Response): Promise<any> {
        try {
           
            return serverResponse(res, HttpCodeEnum.OK, ServerMessages.errorMsgLocale(this.locale, ServerMessagesEnum["role-fetched"]), {});
        } catch (err: any) {
            return serverErrorHandler(err, res, err.message, HttpCodeEnum.SERVERERROR, {});
        }
    }
}