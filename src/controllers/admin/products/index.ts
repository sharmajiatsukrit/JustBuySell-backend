import { Request, Response } from "express";
import { ValidationChain } from "express-validator";
import moment from "moment";
import { AttributeItem, Category, Customer, Offers, Product, ProductRequest, ProductVariation, Unit } from "../../../models";
import { removeObjectKeys, serverResponse, serverErrorHandler, removeSpace, constructResponseMsg, serverInvalidRequest, groupByDate } from "../../../utils";
import { HttpCodeEnum } from "../../../enums/server";
import validate from "./validate";
import EmailService from "../../../utils/email";
import Logger from "../../../utils/logger";
import ServerMessages, { ServerMessagesEnum } from "../../../config/messages";
import ProductVariations from "../../../models/product-variations";
import { prepareNotificationData, prepareWhatsAppNotificationData } from "../../../utils/notification-center";

const fileName = "[admin][product][index.ts]";
export default class ProductController {
    public locale: string = "en";
    public emailService;

    constructor() {
        this.emailService = new EmailService();
    }

    public validate(endPoint: string): ValidationChain[] {
        return validate(endPoint);
    }

    // public async getList(req: Request, res: Response): Promise<any> {
    //     try {
    //         const { locale, page, limit, search } = req.query;
    //         this.locale = (locale as string) || "en";

    //         const pageNumber = parseInt(page as string) || 1;
    //         const limitNumber = parseInt(limit as string) || 10;
    //         const skip = (pageNumber - 1) * limitNumber;
    //         let searchQuery: any = {is_deleted : false};
    //         if (search) {
    //             searchQuery.$or = [{ name: { $regex: search, $options: "i" } }];
    //         }

    //         const results = await Product.find(searchQuery)
    //             .sort({ _id: -1 }) // Sort by _id in descending order
    //             .skip(skip)
    //             .limit(limitNumber)
    //             .lean()
    //             .populate("category_id", "id name");

    //         // Get the total number of documents in the Category collection
    //         const totalCount = await Product.countDocuments(searchQuery);

    //         // Calculate total pages
    //         const totalPages = Math.ceil(totalCount / limitNumber);

    //         if (results.length > 0) {
    //             // Format each item in the result array
    //             const formattedResults = results.map((item, index) => ({
    //                 id: item.id, // Generate a simple sequential ID starting from 1
    //                 name: item.name,
    //                 description: item.description,
    //                 product_image: `${process.env.RESOURCE_URL}${item.product_image}`, // Full URL of category image
    //                 category_id: item.category_id,
    //                 status: item.status,
    //                 // Add more fields as necessary
    //             }));

    //             return serverResponse(res, HttpCodeEnum.OK, ServerMessages.errorMsgLocale(this.locale, ServerMessagesEnum["product-fetched"]), {
    //                 data: formattedResults,
    //                 totalCount,
    //                 totalPages,
    //                 currentPage: pageNumber,
    //             });
    //         } else {
    //             throw new Error(ServerMessages.errorMsgLocale(this.locale, ServerMessagesEnum["not-found"]));
    //         }
    //     } catch (err: any) {
    //         return serverErrorHandler(err, res, err.message, HttpCodeEnum.SERVERERROR, {});
    //     }
    // }

    // Checked
    public async getApprovalRequiredList(req: Request, res: Response): Promise<any> {
        try {
            const { locale, page, limit, search } = req.query;
            this.locale = (locale as string) || "en";

            const pageNumber = parseInt(page as string) || 1;
            const limitNumber = parseInt(limit as string) || 10;
            const skip = (pageNumber - 1) * limitNumber;

            const orConditions: any = [{ name: { $regex: search, $options: "i" } }, { "category.name": { $regex: search, $options: "i" } }];

            const searchAsNumber = Number(search);

            if (!isNaN(searchAsNumber)) {
                orConditions.push({ id: +searchAsNumber });
            }
            let matchQuery: any = { is_deleted: false, admin_approval_required: true, admin_approval_status: 0 };

            if (search) {
                matchQuery.$or = orConditions;
            }

            // Aggregation pipeline
            const pipeline: any[] = [
                {
                    $lookup: {
                        from: "categories",
                        localField: "category_id",
                        foreignField: "_id",
                        as: "category",
                    },
                },
                { $match: matchQuery },
                { $sort: { _id: -1 } },
                { $skip: skip },
                { $limit: limitNumber },
                {
                    $project: {
                        id: 1,
                        name: 1,
                        description: 1,
                        product_image: 1,
                        status: 1,
                        admin_approval_status: 1,
                        "category.id": 1,
                        "category.name": 1,
                    },
                },
            ];

            const results = await Product.aggregate(pipeline);
            const totalCountResult = await Product.aggregate([
                { $lookup: { from: "categories", localField: "category_id", foreignField: "_id", as: "category" } },
                { $unwind: { path: "$category", preserveNullAndEmptyArrays: true } },
                { $match: matchQuery },
                { $count: "total" },
            ]);

            const totalCount = totalCountResult[0]?.total || 0;
            const totalPages = Math.ceil(totalCount / limitNumber);

            if (results.length > 0) {
                const formattedResults = results.map((item: any) => ({
                    id: item.id,
                    name: item.name,
                    description: item.description,
                    product_image: `${process.env.RESOURCE_URL}${item.product_image}`,
                    category_id:
                        item.category?.map((cat: any) => ({
                            id: cat._id,
                            name: cat.name,
                        })) || [],
                    status: item.status,
                    admin_approval_status: item.admin_approval_status,
                }));

                return serverResponse(res, HttpCodeEnum.OK, ServerMessages.errorMsgLocale(this.locale, ServerMessagesEnum["product-fetched"]), {
                    data: formattedResults,
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

    public async updateProductApproval(req: Request, res: Response): Promise<any> {
        try {
            const fn = "[statusUpdate]";

            const { id } = req.params;
            Logger.info(`${fileName + fn} request_id: ${id}`);

            const { locale } = req.query;
            this.locale = (locale as string) || "en";
            const { status } = req.body;

            const productData: any = await Product.findOneAndUpdate(
                { id: id },
                {
                    admin_approval_status: status,
                }
            );

            // const updatedData: any = await Product.findOne({ id: id }).lean();
            const requestData: any = await ProductRequest.findOneAndUpdate(
                { id: productData?.product_request_ref },
                {
                    status: status,
                }
            );
            // const requestData: any = await ProductRequest.findOne({ id: updatedData?.product_request_ref }).lean();

            const customerData: any = await Customer.findOne({ _id: requestData?.created_by }).lean();
            if (productData && status == 1 && productData?.product_request_ref) {
                const notificationData = {
                    tmplt_name: "product_add_request_processed",
                    to: customerData?._id,
                    dynamicKey: {
                        product_name: productData?.name,
                    },
                };
                const whatsAppData = {
                    campaignName: "Product Add Request Processed",
                    userName: customerData?.name,
                    destination: "6204591216",
                    templateParams: [productData?.name],
                };
                prepareNotificationData(notificationData);
                prepareWhatsAppNotificationData(whatsAppData);
            }

            return serverResponse(res, HttpCodeEnum.OK, constructResponseMsg(this.locale, "product-approval-updated"), {});
        } catch (err: any) {
            return serverErrorHandler(err, res, err.message, HttpCodeEnum.SERVERERROR, {});
        }
    }

    public async getList(req: Request, res: Response): Promise<any> {
        try {
            const { locale, page, limit, search } = req.query;
            this.locale = (locale as string) || "en";

            const pageNumber = parseInt(page as string) || 1;
            const limitNumber = parseInt(limit as string) || 10;
            const skip = (pageNumber - 1) * limitNumber;

            const orConditions: any = [{ name: { $regex: search, $options: "i" } }, { "category.name": { $regex: search, $options: "i" } }];

            const searchAsNumber = Number(search);

            if (!isNaN(searchAsNumber)) {
                orConditions.push({ id: +searchAsNumber });
            }
            let matchQuery: any = { is_deleted: false, admin_approval_status: 1 };

            if (search) {
                matchQuery.$or = orConditions;
            }

            // Aggregation pipeline
            const pipeline: any[] = [
                {
                    $lookup: {
                        from: "categories",
                        localField: "category_id",
                        foreignField: "_id",
                        as: "category",
                    },
                },
                { $match: matchQuery },
                { $sort: { _id: -1 } },
                { $skip: skip },
                { $limit: limitNumber },
                {
                    $project: {
                        id: 1,
                        name: 1,
                        description: 1,
                        product_image: 1,
                        status: 1,
                        "category.id": 1,
                        "category.name": 1,
                    },
                },
            ];

            const results = await Product.aggregate(pipeline);
            const totalCountResult = await Product.aggregate([
                { $lookup: { from: "categories", localField: "category_id", foreignField: "_id", as: "category" } },
                { $unwind: { path: "$category", preserveNullAndEmptyArrays: true } },
                { $match: matchQuery },
                { $count: "total" },
            ]);

            const totalCount = totalCountResult[0]?.total || 0;
            const totalPages = Math.ceil(totalCount / limitNumber);

            if (results.length > 0) {
                const formattedResults = results.map((item: any) => ({
                    id: item.id,
                    name: item.name,
                    description: item.description,
                    product_image: `${process.env.RESOURCE_URL}${item.product_image}`,
                    category_id:
                        item.category?.map((cat: any) => ({
                            id: cat._id,
                            name: cat.name,
                        })) || [],
                    status: item.status,
                }));

                return serverResponse(res, HttpCodeEnum.OK, ServerMessages.errorMsgLocale(this.locale, ServerMessagesEnum["product-fetched"]), {
                    data: formattedResults,
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

    public async getById(req: Request, res: Response): Promise<any> {
        try {
            const fn = "[getById]";
            const { locale } = req.query;
            this.locale = (locale as string) || "en";

            const id = parseInt(req.params.id);
            const result: any = await Product.findOne({ id: id }).populate("category_id", "id name").lean();
            //const variations: any = await ProductVariations.findOne({ product_id: result._id }).populate('category_id', 'id name').lean();

            if (result) {
                const formattedResult = {
                    id: result.id,
                    name: result.name,
                    description: result.description,
                    category_id: result.category_id,
                    product_image: `${process.env.RESOURCE_URL}${result.product_image}`,
                    variations: result.variations,
                    search_tags: result.search_tags,
                    individual_label: result.individual_label,
                    master_label: result.master_label,
                    created_by: result.created_by,
                    status: result.status,
                    admin_approval_status:result.admin_approval_status

                };
                return serverResponse(res, HttpCodeEnum.OK, ServerMessages.errorMsgLocale(this.locale, ServerMessagesEnum["product-fetched"]), formattedResult);
            } else {
                throw new Error(ServerMessages.errorMsgLocale(this.locale, ServerMessagesEnum["not-found"]));
            }
        } catch (err: any) {
            return serverErrorHandler(err, res, err.message, HttpCodeEnum.SERVERERROR, {});
        }
    }

    //add
    public async add(req: Request, res: Response): Promise<any> {
        try {
            const fn = "[add]";
            const { locale } = req.query;
            this.locale = (locale as string) || "en";

            const { name, description, category_id, variations, search_tags, individual_label, master_label, status, admin_approval_required, product_request_ref } = req.body;
            let result: any;
            const variation = JSON.parse(variations);

            const cat: any = JSON.parse(category_id);
            const categoryObjects = await Promise.all(
                cat.map(async (categoryId: any) => {
                    // Find category by ID
                    const category: any = await Category.findOne({ id: categoryId });
                    if (!category) {
                        // throw new Error(`Category with ID ${categoryId} not found`);
                    }
                    return category._id; // Return the ObjectId
                })
            );
            if (categoryObjects) {
                const existingProduct: any = await Product.findOne({
                    $or: [{ name }, { product_request_ref }],
                });

                if (existingProduct) {
                    if (existingProduct.name === name) {
                        throw new Error(ServerMessages.errorMsgLocale(this.locale, ServerMessagesEnum["product-exist"]));
                    }

                    if (existingProduct?.product_request_ref === +product_request_ref) {
                        throw new Error(ServerMessages.errorMsgLocale(this.locale, ServerMessagesEnum["product-ref-exist"]));
                    }
                }

                // Create the main product
                result = await Product.create({
                    name,
                    description,
                    category_id: categoryObjects,
                    variations: variation,
                    search_tags: search_tags,
                    individual_label: individual_label,
                    master_label: master_label,
                    status,
                    product_request_ref: admin_approval_required ? product_request_ref : 0,
                });

                if (result) {
                    // Handle product image if uploaded
                    if (req.file) {
                        const product_image = req.file.filename;
                        await Product.findOneAndUpdate({ id: result.id }, { product_image });
                    }

                    return serverResponse(res, HttpCodeEnum.OK, constructResponseMsg(this.locale, "product-add"), {});
                } else {
                    throw new Error(ServerMessages.errorMsgLocale(this.locale, ServerMessagesEnum["not-found"]));
                }
            } else {
                throw new Error(ServerMessages.errorMsgLocale(this.locale, ServerMessagesEnum["not-found"]));
            }
        } catch (err: any) {
            return serverErrorHandler(err, res, err.message, HttpCodeEnum.SERVERERROR, {});
        }
    }

    //update
    public async update(req: Request, res: Response): Promise<any> {
        try {
            const fn = "[update]";

            const id = parseInt(req.params.id);
            Logger.info(`${fileName + fn} category_id: ${id}`);

            // Set locale
            const { locale } = req.query;
            this.locale = (locale as string) || "en";
            const { name, description, category_id, variations, search_tags, individual_label, master_label, status } = req.body;
            const variation = JSON.parse(variations);
            const cat: any = JSON.parse(category_id);
            const categoryObjects = await Promise.all(
                cat.map(async (categoryId: any) => {
                    // Find category by ID
                    const category: any = await Category.findOne({ id: categoryId });
                    if (!category) {
                        // throw new Error(`Category with ID ${categoryId} not found`);
                    }
                    return category._id; // Return the ObjectId
                })
            );
            if (categoryObjects) {
                let result: any = await Product.findOneAndUpdate(
                    { id: id },
                    {
                        name,
                        description,
                        category_id: categoryObjects,
                        variations: variation,
                        search_tags: search_tags,
                        individual_label: individual_label,
                        master_label: master_label,
                        status,
                    }
                );
                let product_image: any;
                if (req.file) {
                    product_image = req?.file?.filename;
                    let resultimage: any = await Product.findOneAndUpdate({ id: result.id }, { product_image: product_image });
                }
                const updatedData: any = await Product.find({ id: id }).lean();
                const offersToInactivate = await Offers.find({
                    product_id: result._id,
                    status: 1,
                }).lean();
                Offers.updateMany({ product_id: result._id, status: 1 }, { $set: { status: 0 } });
                offersToInactivate.forEach((offerData) => {
                    const notificationData = {
                        tmplt_name: "change_in_product_master",
                        to: offerData?.created_by,
                        dynamicKey: {
                            product_name: updatedData?.name,
                        },
                    };
                    // const whatsAppData = {
                    //     campaignName: "Product Add Request Processed",
                    //     userName: customerData?.name,
                    //     destination: "6204591216",
                    //     templateParams: [updatedData?.name],
                    // };
                    prepareNotificationData(notificationData);
                    //prepareWhatsAppNotificationData(whatsAppData);
                });

                return serverResponse(res, HttpCodeEnum.OK, constructResponseMsg(this.locale, "product-update"), updatedData);
            } else {
                throw new Error(ServerMessages.errorMsgLocale(this.locale, ServerMessagesEnum["not-found"]));
            }
        } catch (err: any) {
            return serverErrorHandler(err, res, err.message, HttpCodeEnum.SERVERERROR, {});
        }
    }

    // Delete
    public async delete(req: Request, res: Response): Promise<any> {
        try {
            const fn = "[delete]";
            // Set locale
            const { locale } = req.query;
            this.locale = (locale as string) || "en";

            const id = parseInt(req.params.id);
            const result: any = await Product.findOne({ id: id });
            if (!result) {
                throw new Error(ServerMessages.errorMsgLocale(this.locale, ServerMessagesEnum["not-found"]));
            }

            const offersExistWithProduct = await Offers.find({ product_id: result._id });

            if (offersExistWithProduct.length > 0) {
                throw new Error(ServerMessages.errorMsgLocale(this.locale, ServerMessagesEnum["cannot-delete-product"]));
            }
            await Product.findOneAndUpdate({ id }, { is_deleted: true });
            return serverResponse(res, HttpCodeEnum.OK, ServerMessages.errorMsgLocale(this.locale, ServerMessagesEnum["product-delete"]), {});
        } catch (err: any) {
            return serverErrorHandler(err, res, err.message, HttpCodeEnum.SERVERERROR, {});
        }
    }
    // Status
    public async status(req: Request, res: Response): Promise<any> {
        try {
            const fn = "[status]";
            // Set locale
            const { locale } = req.query;
            this.locale = (locale as string) || "en";

            const id = parseInt(req.params.id);
            const { status } = req.body;
            const updationstatus = await Product.findOneAndUpdate({ id: id }, { status: status }).lean();
            const updatedData: any = await Product.find({ id: id }).lean();
            if (updationstatus) {
                return serverResponse(res, HttpCodeEnum.OK, ServerMessages.errorMsgLocale(this.locale, ServerMessagesEnum["product-status"]), updatedData);
            } else {
                throw new Error(ServerMessages.errorMsgLocale(this.locale, ServerMessagesEnum["not-found"]));
            }
        } catch (err: any) {
            return serverErrorHandler(err, res, err.message, HttpCodeEnum.SERVERERROR, {});
        }
    }
}
