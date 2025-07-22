import { Request, Response } from "express";
import { ValidationChain } from "express-validator";
import moment from "moment";
import { AttributeItem, Category, Product,ProductVariation, Unit } from "../../../models";
import { removeObjectKeys, serverResponse, serverErrorHandler, removeSpace, constructResponseMsg, serverInvalidRequest, groupByDate } from "../../../utils";
import { HttpCodeEnum } from "../../../enums/server";
import validate from "./validate";
import EmailService from "../../../utils/email";
import Logger from "../../../utils/logger";
import ServerMessages, { ServerMessagesEnum } from "../../../config/messages";
import ProductVariations from "../../../models/product-variations";

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

    public async getList(req: Request, res: Response): Promise<any> {
        try {
            const { locale, page, limit, search } = req.query;
            this.locale = (locale as string) || "en";

            const pageNumber = parseInt(page as string) || 1;
            const limitNumber = parseInt(limit as string) || 10;
            const skip = (pageNumber - 1) * limitNumber;
            let searchQuery:any = {};
            if (search) {
                searchQuery.$or = [
                    { name: { $regex: search, $options: 'i' } }
                ];
            }
            
            const results = await Product.find(searchQuery)
                .sort({ _id: -1 }) // Sort by _id in descending order
                .skip(skip)
                .limit(limitNumber)
                .lean().populate("category_id","id name");

            // Get the total number of documents in the Category collection
            const totalCount = await Product.countDocuments({});

            // Calculate total pages
            const totalPages = Math.ceil(totalCount / limitNumber);

            if (results.length > 0) {
                // Format each item in the result array
                const formattedResults = results.map((item, index) => ({
                    id: item.id, // Generate a simple sequential ID starting from 1
                    name: item.name,
                    description: item.description,
                    product_image: `${process.env.RESOURCE_URL}${item.product_image}`, // Full URL of category image
                    category_id:item.category_id,
                    status: item.status,
                    // Add more fields as necessary
                }));

                return serverResponse(
                    res,
                    HttpCodeEnum.OK,
                    ServerMessages.errorMsgLocale(this.locale, ServerMessagesEnum["product-fetched"]),
                    { data: formattedResults, totalCount, totalPages, currentPage: pageNumber }
                );
            } else {
                throw new Error(ServerMessages.errorMsgLocale(this.locale, ServerMessagesEnum["not-found"]));
            }
        } catch (err: any) {
            return serverErrorHandler(err, res, err.message, HttpCodeEnum.SERVERERROR, {});
        }
    }
    // Checked


    // Checked
    public async getById(req: Request, res: Response): Promise<any> {
        try {
            const fn = "[getById]";
            const { locale } = req.query;
            this.locale = (locale as string) || "en";

            const id = parseInt(req.params.id);
            const result: any = await Product.findOne({ id: id })
                                        .populate('category_id', 'id name').lean();
            //const variations: any = await ProductVariations.findOne({ product_id: result._id }).populate('category_id', 'id name').lean();
            
            if (result) {
                const formattedResult = {
                    id: result.id,
                    name: result.name,
                    description: result.description,
                    category_id: result.category_id,
                    product_image: `${process.env.RESOURCE_URL}${result.product_image}`,
                    variations:result.variations,
                    search_tags:result.search_tags,
                    individual_label:result.individual_label,
                    master_label:result.master_label,
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

    //add
    public async add(req: Request, res: Response): Promise<any> {
        try {
            const fn = "[add]";
            const { locale } = req.query;
            this.locale = (locale as string) || "en";
    
            const { name, description, category_id,variations,search_tags,individual_label,master_label, status } = req.body;
            let result: any;
            const variation = JSON.parse(variations);
            
            const cat:any = JSON.parse(category_id);
            const categoryObjects = await Promise.all(
                cat.map(async (categoryId:any) => {
                  // Find category by ID
                  const category:any = await Category.findOne({ id: categoryId });
                  if (!category) {
                    // throw new Error(`Category with ID ${categoryId} not found`);
                  }
                  return category._id;  // Return the ObjectId
                })
              );
            if (categoryObjects) {
                
                // Create the main product
                result = await Product.create({
                    name,
                    description,
                    category_id: categoryObjects,
                    variations:variation,
                    search_tags:search_tags,
                    individual_label:individual_label,
                    master_label:master_label,
                    status
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
            const { name, description, category_id,variations ,search_tags,individual_label,master_label,status } = req.body;
            const variation = JSON.parse(variations);
            const cat:any = JSON.parse(category_id);
            const categoryObjects = await Promise.all(
                cat.map(async (categoryId:any) => {
                  // Find category by ID
                  const category:any = await Category.findOne({ id: categoryId });
                  if (!category) {
                    // throw new Error(`Category with ID ${categoryId} not found`);
                  }
                  return category._id;  // Return the ObjectId
                })
              );
            if (categoryObjects) {
               
                let result: any = await Product.findOneAndUpdate(
                    { id: id },
                    {
                        name,
                        description,
                        category_id: categoryObjects,
                        variations:variation,
                        search_tags:search_tags,
                        individual_label:individual_label,
                        master_label:master_label,
                        status
                    });
                let product_image: any;
                if (req.file) {
                    product_image = req?.file?.filename;
                    let resultimage: any = await Product.findOneAndUpdate({ id: result.id }, { product_image: product_image });
                }
                const updatedData: any = await Product.find({ id: id }).lean();

                return serverResponse(res, HttpCodeEnum.OK, constructResponseMsg(this.locale, "product-update"), updatedData);
            }else{
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
            const result = await Product.deleteOne({ id: id });

            if (result) {
                return serverResponse(res, HttpCodeEnum.OK, ServerMessages.errorMsgLocale(this.locale, ServerMessagesEnum["product-delete"]), result);
            } else {
                throw new Error(ServerMessages.errorMsgLocale(this.locale, ServerMessagesEnum["not-found"]));
            }
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