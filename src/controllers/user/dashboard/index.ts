import { Request, Response } from "express";
import { ValidationChain } from "express-validator";
import moment from "moment";
import { Customer, Banner, Category, Product,Offers,Rating,WatchlistItem } from "../../../models";
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
            const { locale, page, limit,search } = req.query;
            this.locale = (locale as string) || "en";
            const pageNumber = parseInt(page as string) || 1;
            const limitNumber = parseInt(limit as string) || 10;
            const skip = (pageNumber - 1) * limitNumber;

            let searchQuery = {};
            if (search) {
                searchQuery = {
                    status: true,
                    $or: [
                        { name: { $regex: search, $options: 'i' } },
                        { name: { $regex: search, $options: 'i' } },
                    ]
                };
            } else {
                searchQuery = {status: true};
            }
            const results: any = await Category.find(searchQuery)
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
            const { locale, page, limit,search } = req.query;
            this.locale = (locale as string) || "en";
            const pageNumber = parseInt(page as string) || 1;
            const limitNumber = parseInt(limit as string) || 10;
            const skip = (pageNumber - 1) * limitNumber;
            const id = parseInt(req.params.id);
            let results:any;
            let totalCount:any;
            let searchQuery = {};
            
            if(id == 0){
                if (search) {
                    searchQuery = {
                        status: true,
                        $or: [
                            { name: { $regex: search, $options: 'i' } },
                            { name: { $regex: search, $options: 'i' } },
                        ]
                    };
                } else {
                    searchQuery = {status: true};
                }
                results = await Product.find(searchQuery).lean()
                .skip(skip)
                .limit(limitNumber)
                .sort({ id: -1 });
                totalCount = await Product.countDocuments(searchQuery);
            }else{

                const category:any = await Category.findOne({id:id}).lean();
                if (search) {
                    searchQuery = {
                        status: true,category_id:category._id,
                        $or: [
                            { name: { $regex: search, $options: 'i' } },
                            { name: { $regex: search, $options: 'i' } },
                        ]
                    };
                } else {
                    searchQuery = {status: true,category_id:category._id,};
                }
                results = await Product.find(searchQuery).lean()
                .skip(skip)
                .limit(limitNumber)
                .sort({ id: -1 });
                totalCount = await Product.countDocuments(searchQuery);
            }
            
            const totalPages = Math.ceil(totalCount / limitNumber);
            if (results.length > 0) {
                 // Fetch wishlist items for the customer
                 const wishlistItems = await WatchlistItem.find({ customer_id: req.customer.object_id }).populate("product_id","id").populate("watchlist_id", "id").lean();
                // Create an array of wishlist product ids and their corresponding wishlist_id
                const wishlistInfo = wishlistItems.map((item: any) => ({
                    productId: item.product_id.id.toString(),
                    wishlistId: item.watchlist_id.id.toString()
                }));
                const formattedResult = results.map((item: any) => {
                    const wishlist = wishlistInfo.find((entry) => entry.productId === item.id.toString());
                    return {
                    id: item.id,
                    name: item.name,
                    description: item.description,
                    product_image: `${process.env.RESOURCE_URL}${item.product_image}`,
                    wishlist: wishlist ? true : false,
                    wishlist_id: wishlist ? wishlist.wishlistId : null // Add wishlist_id
                }
            });
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
               
                 // Fetch wishlist items for the customer
                 const wishlistItems = await WatchlistItem.find({ customer_id: req.customer.object_id }).populate("product_id","id").populate("watchlist_id", "id").lean();
                //  console.log(wishlistItems);
                 // Create an array of wishlist product ids and their corresponding wishlist_id
                const wishlistInfo = wishlistItems.map((item: any) => {
                    // console.log(item);
                    return {
                        productId: item.product_id.id.toString(),
                        wishlistId: item.watchlist_id.id.toString()
                    }
                });
                // console.log("ee",wishlistInfo);
                const formattedResult = results.map((item: any) => {
                    console.log(item);
                    const wishlist = wishlistInfo.find((entry) => entry.productId === item.id.toString());
                    return {
                    id: item.id,
                    name: item.name,
                    description: item.description,
                    product_image: `${process.env.RESOURCE_URL}${item.product_image}`,
                    wishlist: wishlist ? true : false,
                    wishlist_id: wishlist ? wishlist.wishlistId : null // Add wishlist_id
                }
                });
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
                 // Fetch wishlist items for the customer
                 const wishlistItems = await WatchlistItem.find({ customer_id: req.customer.object_id }).populate("product_id","id").populate("watchlist_id", "id").lean();
                // Create an array of wishlist product ids and their corresponding wishlist_id
                const wishlistInfo = wishlistItems.map((item: any) => ({
                    productId: item.product_id.id.toString(),
                    wishlistId: item.watchlist_id.id.toString()
                }));
                const formattedResult = results.map((item: any) => {
                    const wishlist = wishlistInfo.find((entry) => entry.productId === item.id.toString());
                    return {
                    id: item.id,
                    name: item.name,
                    description: item.description,
                    product_image: `${process.env.RESOURCE_URL}${item.product_image}`,
                    wishlist: wishlist ? true : false,
                    wishlist_id: wishlist ? wishlist.wishlistId : null // Add wishlist_id
                }
            });
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
                 // Fetch wishlist items for the customer
                 const wishlistItems = await WatchlistItem.find({ customer_id: req.customer.object_id }).populate("product_id","id").populate("watchlist_id", "id").lean();
                // Create an array of wishlist product ids and their corresponding wishlist_id
                const wishlistInfo = wishlistItems.map((item: any) => ({
                    productId: item.product_id.id.toString(),
                    wishlistId: item.watchlist_id.id.toString()
                }));
                const formattedResult = results.map((item: any) => {
                    const wishlist = wishlistInfo.find((entry) => entry.productId === item.id.toString());
                    return {
                    id: item.id,
                    name: item.name,
                    description: item.description,
                    product_image: `${process.env.RESOURCE_URL}${item.product_image}`,
                    wishlist: wishlist ? true : false,
                    wishlist_id: wishlist ? wishlist.wishlistId : null // Add wishlist_id
                }
            });
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
                 // Fetch wishlist items for the customer
                 const wishlistItems = await WatchlistItem.find({ customer_id: req.customer.object_id }).populate("product_id","id").populate("watchlist_id", "id").lean();
                // Create an array of wishlist product ids and their corresponding wishlist_id
                const wishlistInfo = wishlistItems.map((item: any) => ({
                    productId: item.product_id.id.toString(),
                    wishlistId: item.watchlist_id.id.toString()
                }));

                const wishlist = wishlistInfo.find((entry) => entry.productId === result.id.toString());
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
                    wishlist: wishlist ? true : false,
                    wishlist_id: wishlist ? wishlist.wishlistId : null // Add wishlist_id
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
            const { locale, page, limit} = req.query;
            this.locale = (locale as string) || "en";
            const pageNumber = parseInt(page as string) || 1;
            const limitNumber = parseInt(limit as string) || 10;
            const skip = (pageNumber - 1) * limitNumber;
            // Extract the query parameters
            
            // const master = req.query.master as string;
            // const sorting = req.query.sorting as string;

            const id = parseInt(req.params.id);
            const { individual,master,sorting,filters} = req.body;
            
            const product:any = await Product.findOne({ id: id }).lean();
            const filter:any = {};
            filter.status = 1;
            filter.type = 0;
            filter.product_id = product._id;

            if (individual) {
                // const individual = req.query.individual as string;
                const individualObj = individual;
            
                if(individualObj.size){
                    filter["individual_pack.individualSize.id"] = individualObj.size;
                }
                if(individualObj.unit){
                    filter["individual_pack.individualUnit.id"] = individualObj.unit;
                }
                
                if(individualObj.type){
                    filter["individual_pack.individualType.id"] = individualObj.type;
                }
                
            }

            if (master) {
                // const master = req.query.master as string;
                const masterObj = master;
                if(masterObj.quantity){
                    filter["master_pack.quantity"] = masterObj.quantity;
                }
                
                if(masterObj.masterType){
                    filter["master_pack.masterType.id"] = masterObj.masterType;
                }
                
            }

            if(filters){
                // const filters = req.query.filters as string;
                const filtersObj = filters;

                if(filtersObj.rating){
                    filter.rating = filtersObj.rating;
                }
                if(filtersObj.distance){
                    filter.distance = filtersObj.distance;
                }
                if(filtersObj.coo){
                    filter.coo = filtersObj.coo;
                }
                if(filtersObj.brand){
                    filter.brand = filtersObj.brand;
                }
                if(filtersObj.state){
                    filter.state = filtersObj.state;
                }
                if(filtersObj.city){
                    filter.city = filtersObj.city;
                }
                // filter.city = filtersObj.city;
            }

            if(sorting){
                // filter.master_pack.quantity = filtersObj.quantity;
                // filter.master_pack.masterType.id = filtersObj.masterType;
            }
            
            const results: any = await Offers.find(filter).select("_id id target_price brand coo buy_quantity product_location individual_pack master_pack selling_unit conversion_unit conversion_rate offer_validity publish_date createdAt").populate('product_id', 'id name').populate('created_by').sort({ _id: -1 }).lean();
            const totalCount = await Offers.countDocuments(filter);
            const totalPages = Math.ceil(totalCount / limitNumber);
            if (results.length > 0) {
                // Map offers to include rating count
            const formattedResult = await Promise.all(
                results.map(async (offer: any) => {
                    const ratingCount = await Rating.countDocuments({ offer_id: offer._id });
                    return {
                        id: offer.id,
                        product_id: offer.product_id,
                        target_price: offer.target_price,
                        buy_quantity: offer.buy_quantity,
                        product_location: offer.product_location,
                        brand: offer.brand,
                        coo: offer.coo,
                        individual_pack: offer.individual_pack,
                        master_pack: offer.master_pack,
                        selling_unit: offer.selling_unit,
                        conversion_unit: offer.conversion_unit,
                        conversion_rate: offer.conversion_rate,
                        offer_validity: offer.offer_validity,
                        publish_date: offer.publish_date,
                        created_by: offer.created_by,
                        rating_count: ratingCount,
                        createdAt:offer.createdAt
                    };
                })
            );
            // console.log(formattedResult); 
                return serverResponse(res, HttpCodeEnum.OK, ServerMessages.errorMsgLocale(this.locale, ServerMessagesEnum["product-fetched"]), { data: formattedResult, totalPages, totalCount, currentPage: pageNumber });
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
            const { individual,master,sorting,filters} = req.body;
            const product:any = await Product.findOne({ id: id }).lean();
            const filter:any = {};
            filter.status = 1;
            filter.type = 1;
            filter.product_id = product._id;

            if (individual) {
                // const individual = req.query.individual as string;
                const individualObj = individual;
            
                if(individualObj.size){
                    filter["individual_pack.individualSize.id"] = individualObj.size;
                }
                if(individualObj.unit){
                    filter["individual_pack.individualUnit.id"] = individualObj.unit;
                }
                
                if(individualObj.type){
                    filter["individual_pack.individualType.id"] = individualObj.type;
                }
                
            }

            if (master) {
                // const master = req.query.master as string;
                const masterObj = master;
                if(masterObj.quantity){
                    filter["master_pack.quantity"] = masterObj.quantity;
                }
                
                if(masterObj.masterType){
                    filter["master_pack.masterType.id"] = masterObj.masterType;
                }
                
            }

            if(filters){
                // const filters = req.query.filters as string;
                const filtersObj = filters;

                if(filtersObj.rating){
                    filter.rating = filtersObj.rating;
                }
                if(filtersObj.distance){
                    filter.distance = filtersObj.distance;
                }
                if(filtersObj.coo){
                    filter.coo = filtersObj.coo;
                }
                if(filtersObj.brand){
                    filter.brand = filtersObj.brand;
                }
                if(filtersObj.state){
                    filter.state = filtersObj.state;
                }
                if(filtersObj.city){
                    filter.city = filtersObj.city;
                }
                // filter.city = filtersObj.city;
            }

            if(sorting){
                // filter.master_pack.quantity = filtersObj.quantity;
                // filter.master_pack.masterType.id = filtersObj.masterType;
            }

            const results: any = await Offers.find(filter).select("id offer_price moq brand coo product_location individual_pack master_pack selling_unit conversion_unit conversion_rate offer_validity publish_date createdAt").populate('product_id', 'id name').populate('created_by').sort({ _id: -1 }).lean();
                   
            const totalCount = await Offers.countDocuments(filter);
            const totalPages = Math.ceil(totalCount / limitNumber);
            if (results.length > 0) {
                // Format the results and add the rating count
            const formattedResult = await Promise.all(
                results.map(async (offer: any) => {
                    const ratingCount = await Rating.countDocuments({ offer_id: offer._id });
                    return {
                        id: offer.id,
                        offer_price: offer.offer_price,
                        moq: offer.moq,
                        brand: offer.brand,
                        coo: offer.coo,
                        product_location: offer.product_location,
                        individual_pack: offer.individual_pack,
                        master_pack: offer.master_pack,
                        selling_unit: offer.selling_unit,
                        conversion_unit: offer.conversion_unit,
                        conversion_rate: offer.conversion_rate,
                        offer_validity: offer.offer_validity,
                        publish_date: offer.publish_date,
                        product_id: offer.product_id,
                        createdBy: offer.created_by,
                        ratingCount: ratingCount, // Total ratings for the offer
                        createdAt:offer.createdAt
                    };
                })
            );
                return serverResponse(res, HttpCodeEnum.OK, ServerMessages.errorMsgLocale(this.locale, ServerMessagesEnum["product-fetched"]), { data: formattedResult, totalPages, totalCount, currentPage: pageNumber });
            } else {
                throw new Error(ServerMessages.errorMsgLocale(this.locale, ServerMessagesEnum["not-found"]));
            }
        } catch (err: any) {
            return serverErrorHandler(err, res, err.message, HttpCodeEnum.SERVERERROR, {});
        }
    }

    public async getOfferFilters(req: Request, res: Response): Promise<any> {
        try {
            const fn = "[getOfferFilters]";
            // Set locale
            const { locale } = req.query;
            this.locale = (locale as string) || "en";
            const product_id = parseInt(req.params.product_id);
            const product:any = await Product.findOne({id:product_id}).lean(); 

            const filters: any = {};
            filters.ratings = [
                {'label':'1 Star & Above','value':1},
                {'label':'2 Star & Above','value':2},
                {'label':'3 Star & Above','value':3},
                {'label':'4 Star & Above','value':4}
            ];
            filters.distance = [
                {'label':'Upto 5KM','value':5},
                {'label':'Upto 10KM','value':10},
                {'label':'Upto 50KM','value':50},
                {'label':'Upto 100KM','value':100},
                {'label':'Upto 200KM','value':200},
                {'label':'Upto 500KM','value':500},
                {'label':'Upto 1000KM','value':1000},
            ];

            const uniqueCoo = await Offers.distinct("coo",{product_id : product._id});
            // Transform to label-value pair
            filters.coo  = uniqueCoo.map((coo) => ({
                label: coo,
                value: coo,
            }));
            // filters.coo = [];
            const uniqueState = await Offers.distinct("state",{product_id : product._id});
            // Transform to label-value pair
            filters.state  = uniqueState.map((state) => ({
                label: state,
                value: state,
            }));
            // filters.state = [];
            const uniqueCity = await Offers.distinct("city",{product_id : product._id});
            // Transform to label-value pair
            filters.city  = uniqueCity.map((coo) => ({
                label: coo,
                value: coo,
            }));
            // filters.city = [];

            const uniqueBrands = await Offers.distinct("brand",{product_id : product._id});
            console.log(uniqueBrands,product);
            // Transform to label-value pair
            filters.brand  = uniqueBrands.map((brand) => ({
                label: brand,
                value: brand,
            }));
            // console.log(filters);
            if(filters){
                return serverResponse(res, HttpCodeEnum.OK, ServerMessages.errorMsgLocale(this.locale, ServerMessagesEnum["product-fetched"]), filters);
            } else {
                throw new Error(ServerMessages.errorMsgLocale(this.locale, ServerMessagesEnum["not-found"]));
            }
        } catch (err: any) {
            return serverErrorHandler(err, res, err.message, HttpCodeEnum.SERVERERROR, {});
        }
    }
   
}