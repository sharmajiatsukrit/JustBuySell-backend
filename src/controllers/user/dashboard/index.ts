import { Request, Response } from "express";
import { ValidationChain } from "express-validator";
import moment from "moment";
import { Customer, Banner, Category, Product,Offers,Rating } from "../../../models";
import { removeObjectKeys, serverResponse, serverErrorHandler, removeSpace, constructResponseMsg, serverInvalidRequest, groupByDate } from "../../../utils";
import { HttpCodeEnum } from "../../../enums/server";
import validate from "./validate";
import EmailService from "../../../utils/email";
import Logger from "../../../utils/logger";
import ServerMessages, { ServerMessagesEnum } from "../../../config/messages";


const fileName = "[user][dashboard][index.ts]";
export default class DashboardController {
    public locale: string = "en";
    public emailService;

    constructor() {
        this.emailService = new EmailService();
    }

    public validate(endPoint: string): ValidationChain[] {
        return validate(endPoint);
    }


    // Checked
    public async getSearch(req: Request, res: Response): Promise<any> {
        try {
            const fn = "[getById]";
            // Set locale
            const { locale } = req.query;
            this.locale = (locale as string) || "en";

            const { search, categoryid } = req.query;

            let query: any = {};

            if (categoryid) {
                query.category_id = categoryid;
            }

            if (search) {
                query.$or = [
                    { name: { $regex: search, $options: 'i' } },
                    { description: { $regex: search, $options: 'i' } },
                    
                ];
            }

            let searchResults = await Product.find(query).select('-createBy -updatedBy -createdAt -updatedAt').lean().populate("category_id").limit(10);

            if (searchResults.length > 0) {
                // Format the response data if needed
                const formattedResults = searchResults.map((result: any) => ({
                    id: result.id,
                    name: result.name,
                    description: result.description,
                    category_id: result.category_id,
                    product_image: `${process.env.RESOURCE_URL}${result.product_image}`
                    // Add other fields you want to include
                }));

                return serverResponse(res, HttpCodeEnum.OK, ServerMessages.errorMsgLocale(this.locale, ServerMessagesEnum["search-fetched"]), formattedResults);
            } else {
                throw new Error(ServerMessages.errorMsgLocale(this.locale, ServerMessagesEnum["not-found"]));
            }
        } catch (err: any) {
            return serverErrorHandler(err, res, err.message, HttpCodeEnum.SERVERERROR, {});
        }
    }

    // Checked
    public async getBanners(req: Request, res: Response): Promise<any> {
        try {
            const fn = "[getBanners]";
            // Set locale
            const { locale } = req.query;
            this.locale = (locale as string) || "en";

            const results: any = await Banner.find({ status: true }).lean();
            console.log(results.length);
            if (results.length > 0) {
                const formattedResult = results.map((item: any) => ({
                    id: item.id,
                    name: item.name,
                    banner: `${process.env.RESOURCE_URL}${item.banner}`,
                    external_url: item.external_url,
                    status: item.status,
                }));
                return serverResponse(res, HttpCodeEnum.OK, ServerMessages.errorMsgLocale(this.locale, ServerMessagesEnum["banner-fetched"]), formattedResult);
            } else {
                throw new Error(ServerMessages.errorMsgLocale(this.locale, ServerMessagesEnum["not-found"]));
            }
        } catch (err: any) {
            return serverErrorHandler(err, res, err.message, HttpCodeEnum.SERVERERROR, {});
        }
    }

    // Checked
    public async getTopCategories(req: Request, res: Response): Promise<any> {
        try {
            const fn = "[getTopCategories]";
            // Set locale
            const { locale, page, limit } = req.query;
            this.locale = (locale as string) || "en";
            const pageNumber = parseInt(page as string) || 1;
            const limitNumber = parseInt(limit as string) || 10;
            const skip = (pageNumber - 1) * limitNumber;
            const results: any = await Category.find({ status: true })
                .lean()
                .skip(skip)
                .limit(limitNumber)
                .sort({ id: -1 });
            const totalCount = await Category.countDocuments({ status: true });
            const totalPages = Math.ceil(totalCount / limitNumber);
            if (results.length > 0) {
                const formattedResult = results.map((item: any) => ({
                    id: item.id,
                    name: item.name,
                    description: item.description,
                    cat_img: `${process.env.RESOURCE_URL}${item.cat_img}`
                }));
                return serverResponse(res, HttpCodeEnum.OK, ServerMessages.errorMsgLocale(this.locale, ServerMessagesEnum["category-fetched"]), { data: formattedResult, totalPages, totalCount, currentPage: pageNumber });
            } else {
                throw new Error(ServerMessages.errorMsgLocale(this.locale, ServerMessagesEnum["not-found"]));
            }
        } catch (err: any) {
            return serverErrorHandler(err, res, err.message, HttpCodeEnum.SERVERERROR, {});
        }
    }

    // Checked
    public async getProductsByCategory(req: Request, res: Response): Promise<any> {
        try {
            const fn = "[getProductsByCategory]";
            // Set locale
            const { locale, page, limit } = req.query;
            this.locale = (locale as string) || "en";
            const pageNumber = parseInt(page as string) || 1;
            const limitNumber = parseInt(limit as string) || 10;
            const skip = (pageNumber - 1) * limitNumber;
            const id = parseInt(req.params.id);
            let results:any;
            let totalCount:any;
            if(id == 0){
                results = await Product.find({ status: true }).lean()
                .skip(skip)
                .limit(limitNumber)
                .sort({ id: -1 });
                totalCount = await Product.countDocuments({ status: true});
            }else{
                const category:any = await Category.findOne({id:id}).lean();
                results = await Product.find({ status: true,category_id:category._id }).lean()
                .skip(skip)
                .limit(limitNumber)
                .sort({ id: -1 });
                totalCount = await Product.countDocuments({ status: true,category_id:category._id });
            }
            
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
    public async getMostSearchedProducts(req: Request, res: Response): Promise<any> {
        try {
            const fn = "[getMostSearchedProducts]";
            // Set locale
            const { locale, page, limit } = req.query;
            this.locale = (locale as string) || "en";
            const pageNumber = parseInt(page as string) || 1;
            const limitNumber = parseInt(limit as string) || 10;
            const skip = (pageNumber - 1) * limitNumber;
            const results: any = await Product.find({ status: true })
                .lean()
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
    public async getMostTradedProducts(req: Request, res: Response): Promise<any> {
        try {
            const fn = "[getMostTradedProducts]";
            // Set locale
            const { locale, page, limit } = req.query;
            this.locale = (locale as string) || "en";
            const pageNumber = parseInt(page as string) || 1;
            const limitNumber = parseInt(limit as string) || 10;
            const skip = (pageNumber - 1) * limitNumber;
            const results: any = await Product.find({ status: true }).lean()
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
    public async getNewlyAddedProducts(req: Request, res: Response): Promise<any> {
        try {
            const fn = "[getNewlyAddedProducts]";
            // Set locale
            const { locale, page, limit } = req.query;
            this.locale = (locale as string) || "en";
            const pageNumber = parseInt(page as string) || 1;
            const limitNumber = parseInt(limit as string) || 10;
            const skip = (pageNumber - 1) * limitNumber;
            const results: any = await Product.find({ status: true }).lean()
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
    public async getProductByID(req: Request, res: Response): Promise<any> {
        try {
            const fn = "[getProductByID]";
            // Set locale
            const { locale, page, limit } = req.query;
            this.locale = (locale as string) || "en";
            const id = parseInt(req.params.id);
            const result: any = await Product.findOne({ status: true,id:id }).populate('category_id', 'id name').lean();
            
            if (result) {
                const formattedResult = {
                    id: result.id,
                    name: result.name,
                    description: result.description,
                    category_id: result.category_id,
                    product_image: `${process.env.RESOURCE_URL}${result.product_image}`,
                    variations:result.variations,
                    conversion_unit:result.conversion_unit,
                    created_by: result.created_by,
                    status: result.status,
                };
                return serverResponse(res, HttpCodeEnum.OK, ServerMessages.errorMsgLocale(this.locale, ServerMessagesEnum["product-fetched"]), formattedResult);
            } else {
                throw new Error(ServerMessages.errorMsgLocale(this.locale, ServerMessagesEnum["not-found"]));
            }
        } catch (err: any) {
            return serverErrorHandler(err, res, err.message, HttpCodeEnum.SERVERERROR, {});
        }
    }


    // Checked
    public async getBuyOfferByProductID(req: Request, res: Response): Promise<any> {
        try {
            const fn = "[getBuyOfferByProductID]";
            // Set locale
            const { locale, page, limit } = req.query;
            this.locale = (locale as string) || "en";
            const pageNumber = parseInt(page as string) || 1;
            const limitNumber = parseInt(limit as string) || 10;
            const skip = (pageNumber - 1) * limitNumber;
            const id = parseInt(req.params.id);
            const product:any = await Product.findOne({ id: id }).lean();
            const results: any = await Offers.find({ status: 1,type: 0,product_id:product._id }).select("_id id target_price brand coo buy_quantity product_location individual_pack master_pack selling_unit conversion_unit conversion_rate").populate('product_id', 'id name').populate('created_by').sort({ _id: -1 }).lean();
            
             
            console.log(results); 
            const totalCount = await Offers.countDocuments({ status: 1,type: 0,product_id:product._id });
            const totalPages = Math.ceil(totalCount / limitNumber);
            if (results.length > 0) {
                const formattedResult = results.map(async (item: any) => {
                    // console.log({
                    //     id: item.id,
                    //     productId: item.product_id,
                    //     targetPrice: item.target_price,
                    //     buyQuantity: item.buy_quantity,
                    //     productLocation: item.product_location,
                    //     createdBy: item.created_by,
                    //     rating_count: 0
                    // });
                    // const total_ratings = await Rating.countDocuments({ offer_id:item._id });
                    return {
                        id: item.id,
                        productId: item.product_id,
                        targetPrice: item.target_price,
                        buyQuantity: item.buy_quantity,
                        productLocation: item.product_location,
                        individual_pack: item.individual_pack,
                        master_pack: item.master_pack,
                        selling_unit: item.selling_unit,
                        conversion_unit: item.conversion_unit,
                        conversion_rate: item.conversion_rate,
                        createdBy: item.created_by,
                        rating_count: 0
                    }
                //    return preparedData; 
                });
                return serverResponse(res, HttpCodeEnum.OK, ServerMessages.errorMsgLocale(this.locale, ServerMessagesEnum["product-fetched"]), { data: results, totalPages, totalCount, currentPage: pageNumber });
            } else {
                throw new Error(ServerMessages.errorMsgLocale(this.locale, ServerMessagesEnum["not-found"]));
            }
        } catch (err: any) {
            return serverErrorHandler(err, res, err.message, HttpCodeEnum.SERVERERROR, {});
        }
    }

    

    // Checked
    public async getSellOfferByProductID(req: Request, res: Response): Promise<any> {
        try {
            const fn = "[getSellOfferByProductID]";
            // Set locale
            const { locale, page, limit } = req.query;
            this.locale = (locale as string) || "en";
            const pageNumber = parseInt(page as string) || 1;
            const limitNumber = parseInt(limit as string) || 10;
            const skip = (pageNumber - 1) * limitNumber;
            const id = parseInt(req.params.id);
            const product:any = await Product.findOne({ id: id }).lean();
            const results: any = await Offers.find({ status: 1,type: 1,product_id:product._id }).select("id offer_price moq brand coo product_location individual_pack master_pack selling_unit conversion_unit conversion_rate").populate('product_id', 'id name').populate('created_by').sort({ _id: -1 }).lean();
                   
            const totalCount = await Offers.countDocuments({ status: 1,type: 1,product_id:product._id });
            const totalPages = Math.ceil(totalCount / limitNumber);
            if (results.length > 0) {
                
                return serverResponse(res, HttpCodeEnum.OK, ServerMessages.errorMsgLocale(this.locale, ServerMessagesEnum["product-fetched"]), { data: results, totalPages, totalCount, currentPage: pageNumber });
            } else {
                throw new Error(ServerMessages.errorMsgLocale(this.locale, ServerMessagesEnum["not-found"]));
            }
        } catch (err: any) {
            return serverErrorHandler(err, res, err.message, HttpCodeEnum.SERVERERROR, {});
        }
    }
   
}