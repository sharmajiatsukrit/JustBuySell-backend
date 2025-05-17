import { Request, Response } from "express";
import { ValidationChain } from "express-validator";
import moment from "moment";
import { Customer, ProductRequest, Watchlist, WatchlistItem, Product, Category, Rating,Setting, Attribute, AttributeItem } from "../../../models";
import { removeObjectKeys, serverResponse, serverErrorHandler, removeSpace, constructResponseMsg, serverInvalidRequest, groupByDate } from "../../../utils";
import { HttpCodeEnum } from "../../../enums/server";
import validate from "./validate";
import EmailService from "../../../utils/email";
import Logger from "../../../utils/logger";
import ServerMessages, { ServerMessagesEnum } from "../../../config/messages";
import { networkRequest } from '../../../utils/request'

const fileName = "[user][helper][index.ts]";
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

    public async requestNewProduct(req: Request, res: Response): Promise<any> {
        try {
            const fn = "[requestNewProduct]";

            // Set locale
            const { locale } = req.query;
            this.locale = (locale as string) || "en";
            const { 
                name, 
                selling_unit_id,selling_unit,
                individual_pack_size_id, individual_pack_size,
                individual_pack_unit_id, individual_pack_unit,
                individual_packing_type_id, individual_packing_type, 
                master_pack_qty,master_pack_type_id, 
                conversion_unit_id, conversion_unit, conversion_unit_rate,
                master_pack_type, description 
            } = req.body;
            let product_image: any;
            if (req.file) {
                product_image = req?.file?.filename;
            } else {
                return serverResponse(res, HttpCodeEnum.OK, "No Product Image Attached", {});
            }

            const result: any = await ProductRequest.create({
                name: name,
                selling_unit_id: selling_unit_id,
                selling_unit: selling_unit,
                individual_pack_size_id: individual_pack_size_id,
                individual_pack_size: individual_pack_size,
                individual_pack_unit_id: individual_pack_unit_id,
                individual_pack_unit: individual_pack_unit,
                individual_packing_type_id: individual_packing_type_id,
                individual_packing_type: individual_packing_type,
                master_pack_qty: master_pack_qty,
                master_pack_type_id: master_pack_type_id,
                master_pack_type: master_pack_type,
                description: description,
                conversion_unit_id: conversion_unit_id,
                conversion_unit: conversion_unit,
                conversion_unit_rate: conversion_unit_rate,
                product_image: product_image,
                created_by: req.customer.object_id
            });

            if (result) {
                return serverResponse(res, HttpCodeEnum.OK, ServerMessages.errorMsgLocale(this.locale, ServerMessagesEnum["product-requested"]), {});
            } else {
                throw new Error(ServerMessages.errorMsgLocale(this.locale, ServerMessagesEnum["server-error"]));
            }
        } catch (err: any) {
            return serverErrorHandler(err, res, err.message, HttpCodeEnum.SERVERERROR, {});
        }
    }

    public async addToWatchlist(req: Request, res: Response): Promise<any> {
        try {
            const fn = "[addToWatchlist]";

            // Set locale
            const { locale } = req.query;
            this.locale = (locale as string) || "en";
            const { watchlist_id, product_id } = req.body;
            console.log(watchlist_id, product_id);
            const watchlist: any = await Watchlist.findOne({ id: watchlist_id }).lean();
            const product: any = await Product.findOne({ id: product_id }).lean();
            console.log(watchlist.id);
            console.log(product._id);
            const result: any = await WatchlistItem.create({
                product_id: product._id,
                watchlist_id: watchlist._id,
                customer_id: req.customer.object_id
            });
            if (result) {
                return serverResponse(res, HttpCodeEnum.OK, ServerMessages.errorMsgLocale(this.locale, ServerMessagesEnum["watchlist-item-add"]), {});
            } else {
                throw new Error(ServerMessages.errorMsgLocale(this.locale, ServerMessagesEnum["server-error"]));
            }
        } catch (err: any) {
            return serverErrorHandler(err, res, err.message, HttpCodeEnum.SERVERERROR, {});
        }
    }

    public async removeFromWatchlist(req: Request, res: Response): Promise<any> {
        try {
            const fn = "[removeFromWatchlist]";

            // Set locale
            const { locale } = req.query;
            this.locale = (locale as string) || "en";
            const { watchlist_id, product_id } = req.body;

            const watchlist: any = await Watchlist.findOne({ id: watchlist_id }).lean();
            const product: any = await Product.findOne({ id: product_id }).lean();

            console.log({
                product_id: product._id,
                watchlist_id: watchlist._id,
                customer_id: req.customer.object_id
            });
            const result = await WatchlistItem.deleteOne({
                product_id: product._id,
                watchlist_id: watchlist._id,
                customer_id: req.customer.object_id
            });

            if (result) {
                return serverResponse(res, HttpCodeEnum.OK, ServerMessages.errorMsgLocale(this.locale, ServerMessagesEnum["watchlist-item-remove"]), {});
            } else {
                throw new Error(ServerMessages.errorMsgLocale(this.locale, ServerMessagesEnum["server-error"]));
            }
        } catch (err: any) {
            return serverErrorHandler(err, res, err.message, HttpCodeEnum.SERVERERROR, {});
        }
    }

    // Checked
    public async getProductsByCat(req: Request, res: Response): Promise<any> {
        try {
            const fn = "[getNewlyAddedProducts]";
            // Set locale
            const { locale, page, limit } = req.query;
            this.locale = (locale as string) || "en";
            const pageNumber = parseInt(page as string) || 1;
            const limitNumber = parseInt(limit as string) || 10;
            const skip = (pageNumber - 1) * limitNumber;
            const cat_id = parseInt(req.params.cat_id);
            const category_id: any = await Category.findOne({ id: cat_id }).lean();
            console.log(category_id);
            if (!category_id) {
                throw new Error(ServerMessages.errorMsgLocale(this.locale, ServerMessagesEnum["not-found"]));
            }
            const results: any = await Product.find({ status: true, category_id: category_id._id }).lean()
                .skip(skip)
                .limit(limitNumber)
                .sort({ id: -1 });
            const totalCount = await Product.countDocuments({ status: true });
            const totalPages = Math.ceil(totalCount / limitNumber);
            if (results.length > 0) {
                const formattedResult = results.map((item: any) => ({
                    id: item.id,
                    name: item.name,
                    description: item.description,
                    product_image: `${process.env.RESOURCE_URL}${item.product_image}`
                }));
                return serverResponse(res, HttpCodeEnum.OK, ServerMessages.errorMsgLocale(this.locale, ServerMessagesEnum["product-fetched"]), { data: formattedResult, totalPages, totalCount, currentPage: pageNumber });
            } else {
                throw new Error(ServerMessages.errorMsgLocale(this.locale, ServerMessagesEnum["not-found"]));
            }
        } catch (err: any) {
            return serverErrorHandler(err, res, err.message, HttpCodeEnum.SERVERERROR, {});
        }
    }


    // Checked
    public async getGSTDetails(req: Request, res: Response): Promise<any> {
        try {
            const fn = "[getGSTDetails]";
            // Set locale
            const { locale, page, limit } = req.query;
            this.locale = (locale as string) || "en";
            const gst = req.params.gst;
            const body:any = {
                                "requestid": moment().unix(),
                                "gstNumber": gst,
                                "hsnDetails": true,
                                "branchDetails": true,
                                "filingDetails": true,
                                "filingFrequency": true,
                                "liabilityPaidDetails": true
                            };
            const headers = {token:process.env.GSTTOKEN,secretkey:process.env.GSTSECRET}
            // console.log(process.env.GSTINCHECK_APIKEY);
            // const response = await networkRequest("GET", `http://sheet.gstincheck.co.in/check/${process.env.GSTINCHECK_APIKEY}/${gst}`,{},{});
            const response = await networkRequest("POST", `https://api.rpacpc.com/services/get-gst-details`,body,headers);
            console.log(response.data);
            if (response.data.flag) {
                const ResultData:any = {
                    "leagal_name":response.data.data.lgnm,
                    "gstin":response.data.data.gstin,
                    "registration_date":response.data.data.rgdt,
                    "permanent_address":response.data.data.pradr.adr,
                    "addr":response.data.data.pradr.addr,
                    "trade_name":response.data.data.tradeNam,
                }
                return serverResponse(res, HttpCodeEnum.OK, ServerMessages.errorMsgLocale(this.locale, ServerMessagesEnum["gst-fetched"]), ResultData);
            } else {
                throw new Error(response.data.message);
            }
        } catch (err: any) {
            return serverErrorHandler(err, res, err.message, HttpCodeEnum.SERVERERROR, {});
        }
    }


    // Checked
    public async getRatingByCustomer(req: Request, res: Response): Promise<any> {
        try {
            const fn = "[getNewlyAddedProducts]";
            // Set locale
            const { locale, page, limit } = req.query;
            this.locale = (locale as string) || "en";
            const pageNumber = parseInt(page as string) || 1;
            const limitNumber = parseInt(limit as string) || 10;
            const skip = (pageNumber - 1) * limitNumber;
            const id = parseInt(req.params.id);
            const customer: any = await Customer.findOne({ id: id }).lean();
            console.log(customer);
            const data:any = {};
            data.customer = customer;
            const results: any = await Rating.find({ customer_id: customer._id }).lean()
                .skip(skip)
                .limit(limitNumber)
                .sort({ id: -1 }).populate("customer_id");
            const totalCount = await Rating.countDocuments({ customer_id: customer._id,status: true });
            const totalPages = Math.ceil(totalCount / limitNumber);
            if (results.length > 0) {
                // const formattedResult = results.map((item: any) => ({
                //     id: item.id,
                //     name: item.name,
                //     description: item.description,
                //     product_image: `${process.env.RESOURCE_URL}${item.product_image}`
                // }));
                // data.rating_count =totalCount;
                data.ratings = results;
                return serverResponse(res, HttpCodeEnum.OK, ServerMessages.errorMsgLocale(this.locale, ServerMessagesEnum["product-fetched"]), { data: data, totalPages, totalCount, currentPage: pageNumber });
            } else {
                throw new Error(ServerMessages.errorMsgLocale(this.locale, ServerMessagesEnum["not-found"]));
            }
        } catch (err: any) {
            return serverErrorHandler(err, res, err.message, HttpCodeEnum.SERVERERROR, {});
        }
    }



    // Checked
    public async getProfileCompleteness(req: Request, res: Response): Promise<any> {
        try {
            const fn = "[getProfileCompleteness]";
            // Set locale
            const { locale} = req.query;
            this.locale = (locale as string) || "en";
           
            const customer: any = await Customer.findOne({ _id: req.customer.object_id }).lean();
            console.log(customer);
            if (customer) {
                const requiredFields = ['name', 'phone', 'email', 'trade_name', 'leagal_name','gst','address_line_1'];
                let filledCount = 0;
                
                // Check how many required fields are filled in the customer's profile
                requiredFields.forEach(field => {
                    if (customer[field] && customer[field].toString().trim() !== '') {
                        filledCount++;
                    }
                });
                
                // Calculate completeness percentage
                const completenessPercentage = (filledCount / requiredFields.length) * 100;
                const isComplete = completenessPercentage === 100;
                const settings:any = await Setting.findOne({ key: "customer_settings" }).lean();
                const message:any = isComplete ? `Profile Completed` : `Dear User,
Complete your profile and receive Rs. ${settings.value.new_registration_topup} in your wallet for FREE! Use this amount to unlock leads on our platform.`;
                return serverResponse(res, HttpCodeEnum.OK, message, {
                    percentage: completenessPercentage.toFixed(2) + '%',
                    isComplete: isComplete // true if 100%, false otherwise
                });
            } else {
                throw new Error(ServerMessages.errorMsgLocale(this.locale, ServerMessagesEnum["not-found"]));
            }
        } catch (err: any) {
            return serverErrorHandler(err, res, err.message, HttpCodeEnum.SERVERERROR, {});
        }
    }

    // Checked
    public async getTaxCommission(req: Request, res: Response): Promise<any> {
        try {
            const fn = "[getTaxCommission]";
            // Set locale
            const { locale} = req.query;
            this.locale = (locale as string) || "en";
            const id = parseInt(req.params.id);
            const category:any = await Category.findOne({id:id}).lean(); 
            const customer:any = await Customer.findOne({_id:req.customer.object_id}).lean(); 
            const result: any = await Setting.findOne({ key: "customer_settings" }).lean();
            const taxCommission = {
                gst:result.value.gst,
                admin_commission:customer.admin_commission ? parseInt(customer.admin_commission) : (category.commission ? parseInt(category.commission):  parseInt(result.value.admin_commission))
            };
            if (taxCommission) {
                return serverResponse(res, HttpCodeEnum.OK, ServerMessages.errorMsgLocale(this.locale, ServerMessagesEnum["product-fetched"]), taxCommission);
            } else {
                throw new Error(ServerMessages.errorMsgLocale(this.locale, ServerMessagesEnum["not-found"]));
            }
        } catch (err: any) {
            return serverErrorHandler(err, res, err.message, HttpCodeEnum.SERVERERROR, {});
        }
    }


    // Checked
    public async getPRDropDown(req: Request, res: Response): Promise<any> {
        try {
            const fn = "[getPRDropDown]";
            // Set locale
            const { locale,search} = req.query;
            this.locale = (locale as string) || "en";
            const type = req.params.type;
            let attribute_id:number = 0;
            if(type== 'selling_unit'){
                 attribute_id = 19;
            }else if(type== 'ips'){
                attribute_id = 8;
            }else if(type== 'ipu'){
                attribute_id = 16;
            }else if(type== 'ipt'){
                attribute_id = 17;
            }else if(type== 'mpt'){
                attribute_id = 18;
            }else if(type== 'cu'){
                attribute_id = 20;
            }

            const attribute: any = await Attribute.findOne({ id: attribute_id }).lean();
            console.log(attribute);
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
                
                return serverResponse(res, HttpCodeEnum.OK, ServerMessages.errorMsgLocale(this.locale, ServerMessagesEnum["product-fetched"]), result);
            } else {
                throw new Error(ServerMessages.errorMsgLocale(this.locale, ServerMessagesEnum["not-found"]));
            }
        } catch (err: any) {
            return serverErrorHandler(err, res, err.message, HttpCodeEnum.SERVERERROR, {});
        }
    }
}