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

            const results = await Product.find({})
                .sort({ _id: -1 }) // Sort by _id in descending order
                .skip(skip)
                .limit(limitNumber)
                .lean();

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
                                        .populate('category_id', 'id name')
                                        .populate('selling_unit', 'id name')
                                        .populate('individual_pack_size', 'id name')
                                        .populate('individual_pack_unit', 'id name')
                                        .populate('individual_packing_type', 'id name')
                                        .populate('master_pack_type', 'id name').populate('conversion_unit', 'id name').lean();
            const variations: any = await ProductVariations.findOne({ product_id: result._id }).populate('category_id', 'id name').lean();
            console.log(result);
            if (result) {
                const formattedResult = {
                    id: result.id,
                    name: result.name,
                    description: result.description,
                    category_id: result.category_id,
                    product_image: `${process.env.RESOURCE_URL}${result.product_image}`,
                    selling_unit:result.selling_unit,
                    individual_pack_size:result.individual_pack_size,
                    individual_pack_unit:result.individual_pack_unit,
                    individual_packing_type:result.individual_packing_type,
                    master_pack_qty:result.master_pack_qty,
                    master_pack_type:result.master_pack_type,
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

    //add
    public async add(req: Request, res: Response): Promise<any> {
        try {
            const fn = "[add]";
            const { locale } = req.query;
            this.locale = (locale as string) || "en";
    
            const { name, description, category_id,attributes,selling_unit,individual_pack_size,individual_pack_unit,individual_packing_type,master_pack_qty,master_pack_type,conversion_unit, status } = req.body;
            let result: any;
            // const attr = JSON.parse(attributes);
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
                const sellingunit:any = await AttributeItem.findOne({id:selling_unit}).lean();
                const individualpacksize:any = await AttributeItem.findOne({id:individual_pack_size}).lean();
                const individualpackunit:any = await AttributeItem.findOne({id:individual_pack_unit}).lean();
                const individualpackingtype:any = await AttributeItem.findOne({id:individual_packing_type}).lean();
                const masterpacktype:any = await AttributeItem.findOne({id:master_pack_type}).lean();
                const conversionUnit:any = await AttributeItem.findOne({id:conversion_unit}).lean();
                // Create the main product
                result = await Product.create({
                    name,
                    description,
                    // attributes:attr,
                    category_id: categoryObjects,
                    selling_unit:selling_unit ? sellingunit._id : null,
                    individual_pack_size:individual_pack_size ? individualpacksize._id : null,
                    individual_pack_unit:individual_pack_unit ? individualpackunit._id : null,
                    individual_packing_type:individual_packing_type ? individualpackingtype._id : null,
                    master_pack_qty:master_pack_qty,
                    master_pack_type:master_pack_type ? masterpacktype._id : null,
                    conversion_unit:conversion_unit ? conversionUnit._id : null,
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
            const { name, description, category_id,attributes, selling_unit,individual_pack_size,individual_pack_unit,individual_packing_type,master_pack_qty,master_pack_type,conversion_unit,status } = req.body;
            // const attr = JSON.parse(attributes);
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
                const sellingunit:any = await AttributeItem.findOne({id:selling_unit}).lean();
                const individualpacksize:any = await AttributeItem.findOne({id:individual_pack_size}).lean();
                const individualpackunit:any = await AttributeItem.findOne({id:individual_pack_unit}).lean();
                const individualpackingtype:any = await AttributeItem.findOne({id:individual_packing_type}).lean();
                const masterpacktype:any = await AttributeItem.findOne({id:master_pack_type}).lean();
                const conversionUnit:any = await AttributeItem.findOne({id:conversion_unit}).lean();
                let result: any = await Product.findOneAndUpdate(
                    { id: id },
                    {
                        name,
                        description,
                        // attributes:attr,
                        category_id: categoryObjects,
                        selling_unit:selling_unit ? sellingunit._id : null,
                        individual_pack_size:individual_pack_size ? individualpacksize._id : null,
                        individual_pack_unit:individual_pack_unit ? individualpackunit._id : null,
                        individual_packing_type:individual_packing_type ? individualpackingtype._id : null,
                        master_pack_qty:master_pack_qty,
                        master_pack_type:master_pack_type ? masterpacktype._id : null,
                        conversion_unit:conversion_unit ? conversionUnit._id : null,
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