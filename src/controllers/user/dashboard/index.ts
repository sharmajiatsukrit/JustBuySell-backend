import { Request, Response } from "express";
import { ValidationChain } from "express-validator";
// import moment from "moment";
import { Customer, Banner, Category, Product, Offers, Rating, WatchlistItem, UnlockOffers } from "../../../models";
import { removeObjectKeys, serverResponse, serverErrorHandler, removeSpace, constructResponseMsg, serverInvalidRequest, groupByDate } from "../../../utils";
import { HttpCodeEnum } from "../../../enums/server";
import validate from "./validate";
import EmailService from "../../../utils/email";
import Logger from "../../../utils/logger";
import ServerMessages, { ServerMessagesEnum } from "../../../config/messages";
import moment from "moment";
import mongoose from "mongoose";
// import moment from 'moment-timezone';
// moment.tz.setDefault('Asia/Kolkata');

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

            // if (search) {
            //     const searchRegex = new RegExp(search, 'i');
            //     query.$or = [
            //         { name: { $regex: search, $options: 'i' } },
            //         { description: { $regex: search, $options: 'i' } },
            //         { search_tags: { $regex: searchRegex } },

            //     ];
            // }
            if (search && typeof search === "string") {
                const searchRegex = new RegExp(search, "i");
                query.$or = [{ name: { $regex: searchRegex } }, { description: { $regex: searchRegex } }, { search_tags: { $regex: searchRegex } }];
            }

            let searchResults = await Product.find(query).select("-createBy -updatedBy -createdAt -updatedAt").lean().populate("category_id").limit(10);

            if (searchResults.length > 0) {
                // Format the response data if needed
                const formattedResults = searchResults.map((result: any) => ({
                    id: result.id,
                    name: result.name,
                    description: result.description,
                    category_id: result.category_id,
                    product_image: `${process.env.RESOURCE_URL}${result.product_image}`,
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

    public async getTopCategories(req: Request, res: Response): Promise<any> {
        try {
            const fn = "[getTopCategories]";
            // Set locale
            const { locale, page, limit, search } = req.query;
            this.locale = (locale as string) || "en";
            const pageNumber = parseInt(page as string) || 1;
            const limitNumber = parseInt(limit as string) || 10;
            const skip = (pageNumber - 1) * limitNumber;

            let searchQuery: any = { status: true, $or: [{ parent_id: { $exists: false } }, { parent_id: null }] };

            if (search) {
                searchQuery.$and = [{ $or: [{ name: { $regex: search, $options: "i" } }] }];
            }

            const results: any = await Category.find(searchQuery).lean().skip(skip).limit(limitNumber).sort({ id: -1 });

            const totalCount = await Category.countDocuments(searchQuery);
            const totalPages = Math.ceil(totalCount / limitNumber);

            if (results.length > 0) {
                // Fetch child counts for each category in parallel
                const categoryIds = results.map((item: any) => item._id);
                const childCounts = await Category.aggregate([{ $match: { parent_id: { $in: categoryIds } } }, { $group: { _id: "$parent_id", count: { $sum: 1 } } }]);

                // Map child counts to a lookup object
                const childCountMap: Record<string, boolean> = {};
                childCounts.forEach((entry) => {
                    childCountMap[entry._id.toString()] = entry.count > 0;
                });

                // Format response with `availableChild` field
                const formattedResult = results.map((item: any) => ({
                    id: item.id,
                    name: item.name,
                    description: item.description,
                    cat_img: `${process.env.RESOURCE_URL}${item.cat_img}`,
                    availableChild: childCountMap[item._id.toString()] || false,
                }));

                return serverResponse(res, HttpCodeEnum.OK, ServerMessages.errorMsgLocale(this.locale, ServerMessagesEnum["category-fetched"]), {
                    data: formattedResult,
                    totalPages,
                    totalCount,
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
    public async getChildCategories(req: Request, res: Response): Promise<any> {
        try {
            const fn = "[getChildCategories]";
            // Extract query parameters
            const { locale, page, limit, search } = req.query;
            this.locale = (locale as string) || "en";
            const pageNumber = parseInt(page as string) || 1;
            const limitNumber = parseInt(limit as string) || 10;
            const skip = (pageNumber - 1) * limitNumber;
            const id = parseInt(req.params.id);

            // Validate parent_id
            if (!id) {
                return serverResponse(res, HttpCodeEnum.BADREQUEST, "Parent ID is required", {});
            }

            // Fetch parent category
            const parentCategory: any = await Category.findOne({ id: id }).lean();
            if (!parentCategory) {
                return serverResponse(res, HttpCodeEnum.NOTFOUND, "Parent category not found", {});
            }

            // Build search query
            let searchQuery: any = { status: true, parent_id: parentCategory._id };

            if (search) {
                searchQuery.$or = [{ name: { $regex: search, $options: "i" } }];
            }

            // Fetch child categories
            const results = await Category.find(searchQuery).lean().skip(skip).limit(limitNumber).sort({ id: -1 });

            // Count total child categories
            const totalCount = await Category.countDocuments(searchQuery);
            const totalPages = Math.ceil(totalCount / limitNumber);

            if (results.length > 0) {
                // Fetch child counts for each category in parallel
                const categoryIds = results.map((item: any) => item._id);
                const childCounts = await Category.aggregate([{ $match: { parent_id: { $in: categoryIds } } }, { $group: { _id: "$parent_id", count: { $sum: 1 } } }]);

                // Map child counts to a lookup object
                const childCountMap: Record<string, boolean> = {};
                childCounts.forEach((entry) => {
                    childCountMap[entry._id.toString()] = entry.count > 0;
                });

                // Format response with `availableChild` field
                const formattedResult = results.map((item: any) => ({
                    id: item.id,
                    name: item.name,
                    description: item.description,
                    cat_img: `${process.env.RESOURCE_URL}${item.cat_img}`,
                    availableChild: childCountMap[item._id.toString()] || false,
                }));

                return serverResponse(res, HttpCodeEnum.OK, ServerMessages.errorMsgLocale(this.locale, ServerMessagesEnum["category-fetched"]), {
                    data: formattedResult,
                    totalPages,
                    totalCount,
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
    public async getProductsByCategory(req: Request, res: Response): Promise<any> {
        try {
            const fn = "[getProductsByCategory]";
            // Set locale
            const { locale, page, limit, search } = req.query;
            this.locale = (locale as string) || "en";
            const pageNumber = parseInt(page as string) || 1;
            const limitNumber = parseInt(limit as string) || 10;
            const skip = (pageNumber - 1) * limitNumber;
            const id = parseInt(req.params.id);
            let results: any;
            let totalCount: any;
            let searchQuery: any = {};

            searchQuery.status = true;
            if (id == 0) {
                if (search && typeof search === "string") {
                    const searchRegex = new RegExp(search, "i");
                    searchQuery.$or = [{ name: { $regex: searchRegex } }, { description: { $regex: searchRegex } }, { search_tags: { $regex: searchRegex } }];
                }
                results = await Product.find(searchQuery).lean().skip(skip).limit(limitNumber).sort({ id: -1 });
                totalCount = await Product.countDocuments(searchQuery);
            } else {
                const category: any = await Category.findOne({ id: id }).lean();

                if (search && typeof search === "string") {
                    const searchRegex = new RegExp(search, "i");
                    searchQuery.category_id = category._id;
                    searchQuery.$or = [{ name: { $regex: searchRegex } }, { description: { $regex: searchRegex } }, { search_tags: { $regex: searchRegex } }];
                } else {
                    searchQuery = { category_id: category._id };
                }

                results = await Product.find(searchQuery).lean().skip(skip).limit(limitNumber).sort({ id: -1 });
                totalCount = await Product.countDocuments(searchQuery);
            }

            const totalPages = Math.ceil(totalCount / limitNumber);
            if (results.length > 0) {
                // Fetch wishlist items for the customer
                const wishlistItems = await WatchlistItem.find({ customer_id: req.customer.object_id }).populate("product_id", "id").populate("watchlist_id", "id").lean();
                // Create an array of wishlist product ids and their corresponding wishlist_id
                const wishlistInfo = wishlistItems.map((item: any) => ({
                    productId: item.product_id.id.toString(),
                    wishlistId: item?.watchlist_id?.id.toString(),
                }));
                const formattedResult = results.map((item: any) => {
                    const wishlist: any = wishlistInfo.find((entry) => entry.productId === item.id.toString());
                    return {
                        id: item.id,
                        name: item.name,
                        description: item.description,
                        product_image: `${process.env.RESOURCE_URL}${item.product_image}`,
                        wishlist: wishlist && typeof wishlist !== "undefined" && typeof wishlist.wishlistId !== "undefined" ? true : false,
                        wishlist_id: wishlist && typeof wishlist !== "undefined" && typeof wishlist.wishlistId !== "undefined" ? wishlist.wishlistId : null, // Add wishlist_id
                    };
                });
                return serverResponse(res, HttpCodeEnum.OK, ServerMessages.errorMsgLocale(this.locale, ServerMessagesEnum["product-fetched"]), {
                    data: formattedResult,
                    totalPages,
                    totalCount,
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
    public async getMostSearchedProducts(req: Request, res: Response): Promise<any> {
        try {
            const fn = "[getMostSearchedProducts]";
            // Set locale
            const { locale, page, limit } = req.query;
            this.locale = (locale as string) || "en";
            const pageNumber = parseInt(page as string) || 1;
            const limitNumber = parseInt(limit as string) || 10;
            const skip = (pageNumber - 1) * limitNumber;

            const results: any = await Product.find({ status: true }).lean().skip(skip).limit(limitNumber).sort({ id: -1 });
            const totalCount = await Product.countDocuments({ status: true });
            const totalPages = Math.ceil(totalCount / limitNumber);

            if (results.length > 0) {
                // Fetch wishlist items for the customer
                const wishlistItems = await WatchlistItem.find({ customer_id: req.customer.object_id }).populate("product_id", "id").populate("watchlist_id", "id").lean();
                //  console.log(wishlistItems);
                // Create an array of wishlist product ids and their corresponding wishlist_id
                const wishlistInfo = wishlistItems.map((item: any) => {
                    // console.log(item);
                    return {
                        productId: item.product_id.id.toString(),
                        wishlistId: item?.watchlist_id?.id.toString(),
                    };
                });
                // console.log("ee",wishlistInfo);
                const formattedResult = results.map((item: any) => {
                    // console.log(item);
                    const wishlist: any = wishlistInfo.find((entry) => entry.productId === item.id.toString());
                    return {
                        id: item.id,
                        name: item.name,
                        description: item.description,
                        product_image: `${process.env.RESOURCE_URL}${item.product_image}`,
                        wishlist: wishlist && typeof wishlist !== "undefined" && typeof wishlist.wishlistId !== "undefined" ? true : false,
                        wishlist_id: wishlist && typeof wishlist !== "undefined" && typeof wishlist.wishlistId !== "undefined" ? wishlist.wishlistId : null, // Add wishlist_id
                    };
                });
                return serverResponse(res, HttpCodeEnum.OK, ServerMessages.errorMsgLocale(this.locale, ServerMessagesEnum["product-fetched"]), {
                    data: formattedResult,
                    totalPages,
                    totalCount,
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
    public async getMostTradedProducts(req: Request, res: Response): Promise<any> {
        try {
            const fn = "[getMostTradedProducts]";
            // Set locale
            const { locale, page, limit } = req.query;
            this.locale = (locale as string) || "en";
            const pageNumber = parseInt(page as string) || 1;
            const limitNumber = parseInt(limit as string) || 10;
            const skip = (pageNumber - 1) * limitNumber;
            const results: any = await Product.find({ status: true }).lean().skip(skip).limit(limitNumber).sort({ id: -1 });
            const totalCount = await Product.countDocuments({ status: true });
            const totalPages = Math.ceil(totalCount / limitNumber);
            if (results.length > 0) {
                // Fetch wishlist items for the customer
                const wishlistItems = await WatchlistItem.find({ customer_id: req.customer.object_id }).populate("product_id", "id").populate("watchlist_id", "id").lean();
                // Create an array of wishlist product ids and their corresponding wishlist_id
                const wishlistInfo = wishlistItems.map((item: any) => ({
                    productId: item.product_id.id.toString(),
                    wishlistId: item?.watchlist_id?.id.toString(),
                }));
                const formattedResult = results.map((item: any) => {
                    const wishlist: any = wishlistInfo.find((entry) => entry.productId === item.id.toString());
                    return {
                        id: item.id,
                        name: item.name,
                        description: item.description,
                        product_image: `${process.env.RESOURCE_URL}${item.product_image}`,
                        wishlist: wishlist && typeof wishlist !== "undefined" && typeof wishlist.wishlistId !== "undefined" ? true : false,
                        wishlist_id: wishlist && typeof wishlist !== "undefined" && typeof wishlist.wishlistId !== "undefined" ? wishlist.wishlistId : null, // Add wishlist_id
                    };
                });
                return serverResponse(res, HttpCodeEnum.OK, ServerMessages.errorMsgLocale(this.locale, ServerMessagesEnum["product-fetched"]), {
                    data: formattedResult,
                    totalPages,
                    totalCount,
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
    public async getNewlyAddedProducts(req: Request, res: Response): Promise<any> {
        try {
            const fn = "[getNewlyAddedProducts]";
            // Set locale
            const { locale, page, limit } = req.query;
            this.locale = (locale as string) || "en";
            const pageNumber = parseInt(page as string) || 1;
            const limitNumber = parseInt(limit as string) || 10;
            const skip = (pageNumber - 1) * limitNumber;
            const results: any = await Product.find({ status: true }).lean().skip(skip).limit(limitNumber).sort({ id: -1 });
            const totalCount = await Product.countDocuments({ status: true });
            const totalPages = Math.ceil(totalCount / limitNumber);
            if (results.length > 0) {
                // Fetch wishlist items for the customer
                const wishlistItems = await WatchlistItem.find({ customer_id: req.customer.object_id }).populate("product_id", "id").populate("watchlist_id", "id").lean();
                // Create an array of wishlist product ids and their corresponding wishlist_id
                const wishlistInfo = wishlistItems.map((item: any) => ({
                    productId: item.product_id.id.toString(),
                    wishlistId: item?.watchlist_id?.id.toString(),
                }));
                const formattedResult = results.map((item: any) => {
                    const wishlist: any = wishlistInfo.find((entry) => entry.productId === item.id.toString());
                    // console.log("chkwish", wishlist);
                    return {
                        id: item.id,
                        name: item.name,
                        description: item.description,
                        product_image: `${process.env.RESOURCE_URL}${item.product_image}`,
                        wishlist: wishlist && typeof wishlist !== "undefined" && typeof wishlist.wishlistId !== "undefined" ? true : false,
                        wishlist_id: wishlist && typeof wishlist !== "undefined" && typeof wishlist.wishlistId !== "undefined" ? wishlist.wishlistId : null, // Add wishlist_id
                    };
                });
                return serverResponse(res, HttpCodeEnum.OK, ServerMessages.errorMsgLocale(this.locale, ServerMessagesEnum["product-fetched"]), {
                    data: formattedResult,
                    totalPages,
                    totalCount,
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
    public async getProductByID(req: Request, res: Response): Promise<any> {
        try {
            const fn = "[getProductByID]";
            // Set locale
            const { locale, page, limit } = req.query;
            this.locale = (locale as string) || "en";
            const id = parseInt(req.params.id);
            const result: any = await Product.findOne({ status: true, id: id }).populate("category_id", "id name").lean();

            if (result) {
                // Fetch wishlist items for the customer
                const wishlistItems = await WatchlistItem.find({ customer_id: req.customer.object_id }).populate("product_id", "id").populate("watchlist_id", "id").lean();
                // Create an array of wishlist product ids and their corresponding wishlist_id
                const wishlistInfo = wishlistItems.map((item: any) => ({
                    productId: item.product_id.id.toString(),
                    wishlistId: item.watchlist_id.id.toString(),
                }));

                const wishlist = wishlistInfo.find((entry) => entry.productId === result.id.toString());
                const formattedResult = {
                    id: result.id,
                    name: result.name,
                    description: result.description,
                    category_id: result.category_id,
                    product_image: `${process.env.RESOURCE_URL}${result.product_image}`,
                    variations: result.variations,
                    conversion_unit: result.conversion_unit,
                    individual_label: result.individual_label,
                    master_label: result.master_label,
                    created_by: result.created_by,
                    status: result.status,
                    wishlist: wishlist ? true : false,
                    wishlist_id: wishlist ? wishlist.wishlistId : null, // Add wishlist_id
                };
                return serverResponse(res, HttpCodeEnum.OK, ServerMessages.errorMsgLocale(this.locale, ServerMessagesEnum["product-fetched"]), formattedResult);
            } else {
                throw new Error(ServerMessages.errorMsgLocale(this.locale, ServerMessagesEnum["not-found"]));
            }
        } catch (err: any) {
            return serverErrorHandler(err, res, err.message, HttpCodeEnum.SERVERERROR, {});
        }
    }

    // public async getBuyOfferByProductIDs(req: Request, res: Response): Promise<any> {
    //     try {
    //         const fn = "[getBuyOfferByProductID]";
    //         const { locale, page, limit } = req.query;
    //         this.locale = (locale as string) || "en";
    //         const pageNumber = parseInt(page as string) || 1;
    //         const limitNumber = parseInt(limit as string) || 10;
    //         const skip = (pageNumber - 1) * limitNumber;
    //         const id = parseInt(req.params.id);

    //         const { individual, master, sorting, filters } = req.body;
    //         const filtersObj = filters || {};

    //         // Extract location data from the request filters
    //         const { lat, lng, distance } = filtersObj;

    //         const now = moment().tz("Asia/Kolkata").format("YYYY-MM-DD HH:mm:ss");

    //         const product: any = await Product.findOne({ id: id }).lean();
    //         if (!product) {
    //             throw new Error(ServerMessages.errorMsgLocale(this.locale, ServerMessagesEnum["not-found"]));
    //         }

    //         // This object contains all filters EXCEPT for distance
    //         const matchFilter: any = {
    //             status: 1,
    //             type: "0",
    //             product_id: product._id,
    //             $expr: {
    //                 /* ... your full date validity expression ... */
    //             },
    //         };

    //         // filters ---
    //         if (individual) {
    //             if (individual.size) matchFilter["individual_pack.individual.individualSize.id"] = individual.size;
    //             if (individual.unit) matchFilter["individual_pack.individual.individualUnit.id"] = individual.unit;
    //             if (individual.type) matchFilter["individual_pack.individual.individualType.id"] = individual.type;
    //         }
    //         if (master) {
    //             if (master.quantity) matchFilter["master_pack.quantity"] = master.quantity.toString();
    //             if (master.masterType) matchFilter["master_pack.masterType.id"] = master.masterType;
    //         }
    //         if (filtersObj.coo) matchFilter.coo = filtersObj.coo;
    //         if (filtersObj.brand) matchFilter.brand = filtersObj.brand;
    //         if (filtersObj.state) matchFilter.state = filtersObj.state;
    //         if (filtersObj.city) matchFilter.city = filtersObj.city;

    //         // -- AGGREGATION pipeline --
    //         const pipeline: any[] = [];

    //         // Conditionally add $geoNear as the FIRST stage for optimal performance
    //         if (lat && lng && distance) {
    //             pipeline.push({
    //                 $geoNear: {
    //                     near: {
    //                         type: "Point",
    //                         coordinates: [
    //                             parseFloat(lng as string), // longitude first
    //                             parseFloat(lat as string), // latitude second
    //                         ],
    //                     },
    //                     // The new field that will contain the calculated distance in meters
    //                     distanceField: "distance_from_user",
    //                     // Max distance must be in meters, so we convert from KM
    //                     maxDistance: parseInt(distance as string) * 1000,
    //                     // Apply all other filters for efficiency
    //                     query: matchFilter,
    //                     // Use the indexed field
    //                     key: "location",
    //                     spherical: true,
    //                 },
    //             });
    //         } else {
    //             // If no location filters, use the original $match stage
    //             pipeline.push({ $match: matchFilter });
    //         }

    //         // --- The rest of the pipeline continues as before ---
    //         pipeline.push({
    //             $lookup: { from: "ratings", localField: "created_by", foreignField: "customer_id", as: "seller_ratings" },
    //         });
    //         pipeline.push({
    //             $addFields: { averageRating: { $avg: "$seller_ratings.rating" }, totalRatings: { $size: "$seller_ratings" } },
    //         });
    //         pipeline.push({
    //             $lookup: { from: "customers", localField: "created_by", foreignField: "_id", as: "created_by" },
    //         });
    //         pipeline.push({
    //             $unwind: { path: "$created_by", preserveNullAndEmptyArrays: true },
    //         });

    //         if (filtersObj.rating) {
    //             pipeline.push({ $match: { averageRating: { $gte: Number(filtersObj.rating) } } });
    //         }

    //         // --- SORT ---
    //         const sortOption: any = {};
    //         if (sorting === 1) sortOption["id"] = -1;
    //         else if (sorting === 2) sortOption["offer_price"] = 1;
    //         else if (sorting === 3) sortOption["buy_quantity"] = -1;
    //         else if (sorting === 4) sortOption["buy_quantity"] = 1;
    //         // Add sorting by distance (nearest first)
    //         else if (sorting === "distance") sortOption["distance_from_user"] = 1;
    //         else sortOption["_id"] = -1;
    //         pipeline.push({ $sort: sortOption });

    //         pipeline.push({ $skip: skip });
    //         pipeline.push({ $limit: limitNumber });

    //         pipeline.push({
    //             $project: {
    //                 // Add all fields you want to return
    //                 id: 1,
    //                 offer_price: 1,
    //                 buy_quantity: 1,
    //                 target_price: 1,
    //                 moq: 1,
    //                 brand: 1,
    //                 coo: 1,
    //                 product_location: 1,
    //                 individual_pack: 1,
    //                 master_pack: 1,
    //                 selling_unit: 1,
    //                 conversion_unit: 1,
    //                 conversion_rate: 1,
    //                 offer_validity: 1,
    //                 publish_date: 1,
    //                 created_by: 1,
    //                 offer_counter: 1,
    //                 averageRating: 1,
    //                 totalRatings: 1,
    //                 createdAt: 1,
    //                 // Include the calculated distance in the final output
    //                 distance_from_user: 1,
    //             },
    //         });

    //         const results = await Offers.aggregate(pipeline);

    //         const countPipeline = pipeline.filter((stage) => !("$skip" in stage) && !("$limit" in stage));
    //         countPipeline.push({ $count: "totalCount" });
    //         const countResult = await Offers.aggregate(countPipeline);
    //         const totalCount = countResult[0]?.totalCount || 0;
    //         const totalPages = Math.ceil(totalCount / limitNumber);

    //         if (results.length > 0) {
    //             const formattedResult = await Promise.all(
    //                 results.map(async (offer: any) => {
    //                     const checkPurchase = await UnlockOffers.findOne({
    //                         offer_id: offer._id,
    //                         created_by: req.customer.object_id,
    //                         offer_counter: offer.offer_counter,
    //                     }).lean();

    //                     return {
    //                         id: offer.id,
    //                         offer_price: offer.offer_price,
    //                         buy_quantity: offer.buy_quantity,
    //                         target_price: offer.target_price,
    //                         moq: offer.moq,
    //                         brand: offer.brand,
    //                         coo: offer.coo,
    //                         product_location: offer.product_location,
    //                         individual_pack: offer.individual_pack,
    //                         master_pack: offer.master_pack,
    //                         selling_unit: offer.selling_unit,
    //                         conversion_unit: offer.conversion_unit,
    //                         conversion_rate: offer.conversion_rate,
    //                         offer_validity: offer.offer_validity,
    //                         publish_date: offer.publish_date,
    //                         product_id: product,
    //                         createdBy: offer.created_by,
    //                         is_purchased: !!checkPurchase,
    //                         rating_count: offer.totalRatings || 0,
    //                         average_rating: offer.averageRating ? Number(offer.averageRating.toFixed(1)) : 0,
    //                         createdAt: offer.createdAt,
    //                         // Add the distance to the final formatted object (value is in meters)
    //                         distance: offer.distance_from_user,
    //                     };
    //                 })
    //             );

    //             return serverResponse(res, HttpCodeEnum.OK, ServerMessages.errorMsgLocale(this.locale, ServerMessagesEnum["product-fetched"]), {
    //                 data: formattedResult,
    //                 totalPages,
    //                 totalCount,
    //                 currentPage: pageNumber,
    //             });
    //         } else {
    //             throw new Error(ServerMessages.errorMsgLocale(this.locale, ServerMessagesEnum["not-found"]));
    //         }
    //     } catch (err: any) {
    //         return serverErrorHandler(err, res, err.message, HttpCodeEnum.SERVERERROR, {});
    //     }
    // }

    public async getBuyOfferByProductID(req: Request, res: Response): Promise<any> {
        try {
            const fn = "[getBuyOfferByProductID]";
            const { locale, page, limit } = req.query;
            this.locale = (locale as string) || "en";
            const pageNumber = parseInt(page as string) || 1;
            const limitNumber = parseInt(limit as string) || 10;
            const skip = (pageNumber - 1) * limitNumber;
            const id = parseInt(req.params.id);

            const { individual, master, sorting, filters } = req.body;
            const filtersObj = filters || {};
            const { lat, lng, distance } = filtersObj;

            const now = moment().tz("Asia/Kolkata").format("YYYY-MM-DD HH:mm:ss");

            const product: any = await Product.findOne({ id: id }).lean();
            if (!product) {
                throw new Error(ServerMessages.errorMsgLocale(this.locale, ServerMessagesEnum["not-found"]));
            }

            const matchFilter: any = {
                status: 1,
                type: "0",
                product_id: product._id,
                $expr: {
                    $gt: [
                        {
                            $add: [
                                {
                                    $dateFromString: {
                                        dateString: "$publish_date",
                                        format: "%Y-%m-%d %H:%M:%S",
                                        timezone: "Asia/Kolkata",
                                    },
                                },
                                {
                                    $add: [
                                        {
                                            $multiply: [
                                                {
                                                    $toInt: {
                                                        $arrayElemAt: [{ $split: ["$offer_validity", ":"] }, 0],
                                                    },
                                                },
                                                60 * 60 * 1000,
                                            ],
                                        },
                                        {
                                            $multiply: [
                                                {
                                                    $toInt: {
                                                        $arrayElemAt: [{ $split: ["$offer_validity", ":"] }, 1],
                                                    },
                                                },
                                                60 * 1000,
                                            ],
                                        },
                                    ],
                                },
                            ],
                        },
                        now,
                    ],
                },
            };

            // filters ---
            if (individual) {
                if (individual.size) matchFilter["individual_pack.individual.individualSize.id"] = individual.size;
                if (individual.unit) matchFilter["individual_pack.individual.individualUnit.id"] = individual.unit;
                if (individual.type) matchFilter["individual_pack.individual.individualType.id"] = individual.type;
            }
            if (master) {
                if (master.quantity) matchFilter["master_pack.quantity"] = master.quantity.toString();
                if (master.masterType) matchFilter["master_pack.masterType.id"] = master.masterType;
            }
            if (filtersObj.coo) matchFilter.coo = filtersObj.coo;
            if (filtersObj.brand) matchFilter.brand = filtersObj.brand;
            if (filtersObj.state) matchFilter.state = filtersObj.state;
            if (filtersObj.city) matchFilter.city = filtersObj.city;

            // -- AGGREGATION pipeline --
            const pipeline: any[] = [];
            if (lat && lng && distance) {
                pipeline.push({
                    $geoNear: {
                        near: {
                            type: "Point",
                            coordinates: [
                                parseFloat(lng as string), // longitude first
                                parseFloat(lat as string), // latitude second
                            ],
                        },
                        // The new field that will contain the calculated distance in meters
                        distanceField: "distance_from_user",
                        // Max distance must be in meters, so we convert from KM
                        maxDistance: parseInt(distance as string) * 1000,
                        // Apply all other filters for efficiency
                        query: matchFilter,
                        // Use the indexed field
                        key: "location",
                        spherical: true,
                    },
                });
            } else {
                pipeline.push({ $match: matchFilter });
            }

            pipeline.push({
                $lookup: {
                    from: "ratings",
                    localField: "created_by",
                    foreignField: "customer_id",
                    as: "seller_ratings",
                },
            });
            pipeline.push({
                $addFields: {
                    averageRating: { $avg: "$seller_ratings.rating" },
                    totalRatings: { $size: "$seller_ratings" },
                },
            });

            pipeline.push({
                $lookup: {
                    from: "customers",
                    localField: "created_by",
                    foreignField: "_id",
                    as: "created_by",
                },
            });
            pipeline.push({
                $unwind: { path: "$created_by", preserveNullAndEmptyArrays: true },
            });

            if (filtersObj.rating) {
                pipeline.push({
                    $match: { averageRating: { $gte: Number(filtersObj.rating) } },
                });
            }

            // --- SORT ---
            const sortOption: any = {};
            if (sorting === 1) sortOption["id"] = -1;
            else if (sorting === 2) sortOption["offer_price"] = 1;
            else if (sorting === 3) sortOption["buy_quantity"] = -1;
            else if (sorting === 4) sortOption["buy_quantity"] = 1;
            else if (sorting === "distance") sortOption["distance_from_user"] = 1;
            else sortOption["_id"] = -1;
            pipeline.push({ $sort: sortOption });

            pipeline.push({ $skip: skip });
            pipeline.push({ $limit: limitNumber });

            pipeline.push({
                $project: {
                    id: 1,
                    offer_price: 1,
                    buy_quantity: 1,
                    target_price: 1,
                    moq: 1,
                    brand: 1,
                    coo: 1,
                    product_location: 1,
                    individual_pack: 1,
                    master_pack: 1,
                    selling_unit: 1,
                    conversion_unit: 1,
                    conversion_rate: 1,
                    offer_validity: 1,
                    publish_date: 1,
                    created_by: 1,
                    offer_counter: 1,
                    averageRating: 1,
                    totalRatings: 1,
                    createdAt: 1,
                },
            });

            const results = await Offers.aggregate(pipeline);

            const countPipeline = pipeline.filter((stage) => !("$skip" in stage) && !("$limit" in stage));
            countPipeline.push({ $count: "totalCount" });
            const countResult = await Offers.aggregate(countPipeline);
            const totalCount = countResult[0]?.totalCount || 0;
            const totalPages = Math.ceil(totalCount / limitNumber);

            if (results.length > 0) {
                const formattedResult = await Promise.all(
                    results.map(async (offer: any) => {
                        const checkPurchase = await UnlockOffers.findOne({
                            offer_id: offer._id,
                            created_by: req.customer.object_id,
                            offer_counter: offer.offer_counter,
                        }).lean();

                        return {
                            id: offer.id,
                            offer_price: offer.offer_price,
                            buy_quantity: offer.buy_quantity,
                            target_price: offer.target_price,
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
                            product_id: product,
                            createdBy: offer.created_by,
                            is_purchased: !!checkPurchase,
                            rating_count: offer.totalRatings || 0,
                            average_rating: offer.averageRating ? Number(offer.averageRating.toFixed(1)) : 0,
                            createdAt: offer.createdAt,
                        };
                    })
                );

                return serverResponse(res, HttpCodeEnum.OK, ServerMessages.errorMsgLocale(this.locale, ServerMessagesEnum["product-fetched"]), {
                    data: formattedResult,
                    totalPages,
                    totalCount,
                    currentPage: pageNumber,
                });
            } else {
                throw new Error(ServerMessages.errorMsgLocale(this.locale, ServerMessagesEnum["not-found"]));
            }
        } catch (err: any) {
            console.log("err", err);
            return serverErrorHandler(err, res, err.message, HttpCodeEnum.SERVERERROR, {});
        }
    }

    public async getSellOfferByProductID(req: Request, res: Response): Promise<any> {
        try {
            const fn = "[getSellOfferByProductID]";
            const { locale, page, limit } = req.query;
            this.locale = (locale as string) || "en";
            const pageNumber = parseInt(page as string) || 1;
            const limitNumber = parseInt(limit as string) || 10;
            const skip = (pageNumber - 1) * limitNumber;
            const id = parseInt(req.params.id);

            const { individual, master, sorting, filters } = req.body;
            const filtersObj = filters || {};
            const { lat, lng, distance } = filtersObj;

            const now = moment().tz("Asia/Kolkata").format("YYYY-MM-DD HH:mm:ss");

            const product: any = await Product.findOne({ id: id }).lean();
            if (!product) {
                throw new Error(ServerMessages.errorMsgLocale(this.locale, ServerMessagesEnum["not-found"]));
            }

            const matchFilter: any = {
                status: 1,
                type: "1",
                product_id: product._id,
                $expr: {
                    $gt: [
                        {
                            $add: [
                                {
                                    $dateFromString: {
                                        dateString: "$publish_date",
                                        format: "%Y-%m-%d %H:%M:%S",
                                        timezone: "Asia/Kolkata",
                                    },
                                },
                                {
                                    $add: [
                                        {
                                            $multiply: [
                                                {
                                                    $toInt: {
                                                        $arrayElemAt: [{ $split: ["$offer_validity", ":"] }, 0],
                                                    },
                                                },
                                                60 * 60 * 1000,
                                            ],
                                        },
                                        {
                                            $multiply: [
                                                {
                                                    $toInt: {
                                                        $arrayElemAt: [{ $split: ["$offer_validity", ":"] }, 1],
                                                    },
                                                },
                                                60 * 1000,
                                            ],
                                        },
                                    ],
                                },
                            ],
                        },
                        now,
                    ],
                },
            };

            // --- Your other filters ---
            if (individual) {
                if (individual.size) matchFilter["individual_pack.individual.individualSize.id"] = individual.size;
                if (individual.unit) matchFilter["individual_pack.individual.individualUnit.id"] = individual.unit;
                if (individual.type) matchFilter["individual_pack.individual.individualType.id"] = individual.type;
            }
            if (master) {
                if (master.quantity) matchFilter["master_pack.quantity"] = master.quantity.toString();
                if (master.masterType) matchFilter["master_pack.masterType.id"] = master.masterType;
            }
            if (filtersObj.coo) matchFilter.coo = filtersObj.coo;
            if (filtersObj.brand) matchFilter.brand = filtersObj.brand;
            if (filtersObj.state) matchFilter.state = filtersObj.state;
            if (filtersObj.city) matchFilter.city = filtersObj.city;

            // -- AGGREGATION pipeline --
            const pipeline: any[] = [];
            if (lat && lng && distance) {
                pipeline.push({
                    $geoNear: {
                        near: {
                            type: "Point",
                            coordinates: [
                                parseFloat(lng as string), // longitude first
                                parseFloat(lat as string), // latitude second
                            ],
                        },
                        // The new field that will contain the calculated distance in meters
                        distanceField: "distance_from_user",
                        // Max distance must be in meters, so we convert from KM
                        maxDistance: parseInt(distance as string) * 1000,
                        // Apply all other filters for efficiency
                        query: matchFilter,
                        // Use the indexed field
                        key: "location",
                        spherical: true,
                    },
                });
            } else {
                pipeline.push({ $match: matchFilter });
            }
            pipeline.push({
                $lookup: {
                    from: "ratings",
                    localField: "created_by",
                    foreignField: "customer_id",
                    as: "seller_ratings",
                },
            });
            pipeline.push({
                $addFields: {
                    averageRating: { $avg: "$seller_ratings.rating" },
                    totalRatings: { $size: "$seller_ratings" },
                },
            });
            pipeline.push({
                $lookup: {
                    from: "customers",
                    localField: "created_by",
                    foreignField: "_id",
                    as: "created_by",
                },
            });
            pipeline.push({
                $unwind: { path: "$created_by", preserveNullAndEmptyArrays: true },
            });
            if (filtersObj.rating) {
                pipeline.push({
                    $match: { averageRating: { $gte: Number(filtersObj.rating) } },
                });
            }

            // --- SORT ---
            const sortOption: any = {};
            if (sorting === 1) sortOption["id"] = -1;
            else if (sorting === 2) sortOption["offer_price"] = 1;
            else if (sorting === 3) sortOption["moq"] = -1;
            else if (sorting === 4) sortOption["moq"] = 1;
            else if (sorting === "distance") sortOption["distance_from_user"] = 1;
            else sortOption["_id"] = -1;
            pipeline.push({ $sort: sortOption });

            pipeline.push({ $skip: skip });
            pipeline.push({ $limit: limitNumber });

            pipeline.push({
                $project: {
                    id: 1,
                    offer_price: 1,
                    moq: 1,
                    brand: 1,
                    coo: 1,
                    product_location: 1,
                    individual_pack: 1,
                    master_pack: 1,
                    selling_unit: 1,
                    conversion_unit: 1,
                    conversion_rate: 1,
                    offer_validity: 1,
                    publish_date: 1,
                    created_by: 1,
                    offer_counter: 1,
                    averageRating: 1,
                    totalRatings: 1,
                    createdAt: 1,
                },
            });

            const results = await Offers.aggregate(pipeline);

            const countPipeline = pipeline.filter((stage) => !("$skip" in stage) && !("$limit" in stage));
            countPipeline.push({ $count: "totalCount" });
            const countResult = await Offers.aggregate(countPipeline);
            const totalCount = countResult[0]?.totalCount || 0;
            const totalPages = Math.ceil(totalCount / limitNumber);
            if (results.length > 0) {
                const formattedResult = await Promise.all(
                    results.map(async (offer: any) => {
                        const checkPurchase = await UnlockOffers.findOne({
                            offer_id: offer._id,
                            created_by: req.customer.object_id,
                            offer_counter: offer.offer_counter,
                        }).lean();

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
                            product_id: product,
                            createdBy: offer.created_by,
                            is_purchased: !!checkPurchase,
                            rating_count: offer.totalRatings || 0,
                            average_rating: offer.averageRating ? Number(offer.averageRating.toFixed(1)) : 0,
                            createdAt: offer.createdAt,
                        };
                    })
                );

                return serverResponse(res, HttpCodeEnum.OK, ServerMessages.errorMsgLocale(this.locale, ServerMessagesEnum["product-fetched"]), {
                    data: formattedResult,
                    totalPages,
                    totalCount,
                    currentPage: pageNumber,
                });
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
            const product: any = await Product.findOne({ id: product_id }).lean();

            const filters: any = {};
            filters.ratings = [
                { label: "1 Star & Above", value: 1 },
                { label: "2 Star & Above", value: 2 },
                { label: "3 Star & Above", value: 3 },
                { label: "4 Star & Above", value: 4 },
            ];
            filters.distance = [
                { label: "Upto 5KM", value: 5 },
                { label: "Upto 10KM", value: 10 },
                { label: "Upto 50KM", value: 50 },
                { label: "Upto 100KM", value: 100 },
                { label: "Upto 200KM", value: 200 },
                { label: "Upto 500KM", value: 500 },
                { label: "Upto 1000KM", value: 1000 },
            ];

            const uniqueCoo = await Offers.distinct("coo", { product_id: product._id });
            filters.coo = uniqueCoo.map((coo) => ({
                label: coo,
                value: coo,
            }));
            // filters.coo = [];
            const uniqueState = await Offers.distinct("state", { product_id: product._id });
            filters.state = uniqueState.map((state) => ({
                label: state,
                value: state,
            }));
            // filters.state = [];
            const uniqueCity = await Offers.distinct("city", { product_id: product._id });
            // Transform to label-value pair
            filters.city = uniqueCity.map((coo) => ({
                label: coo,
                value: coo,
            }));
            // filters.city = [];

            const uniqueBrands = await Offers.distinct("brand", { product_id: product._id });
            filters.brand = uniqueBrands.map((brand) => ({
                label: brand,
                value: brand,
            }));
            // console.log(filters);
            if (filters) {
                return serverResponse(res, HttpCodeEnum.OK, ServerMessages.errorMsgLocale(this.locale, ServerMessagesEnum["product-fetched"]), filters);
            } else {
                throw new Error(ServerMessages.errorMsgLocale(this.locale, ServerMessagesEnum["not-found"]));
            }
        } catch (err: any) {
            return serverErrorHandler(err, res, err.message, HttpCodeEnum.SERVERERROR, {});
        }
    }
}
