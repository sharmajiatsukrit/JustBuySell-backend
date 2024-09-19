import { Request, Response } from "express";
import { ValidationChain } from "express-validator";
import moment from "moment";
import { Category, Product, Unit } from "../../../models";
import { removeObjectKeys, serverResponse, serverErrorHandler, removeSpace, constructResponseMsg, serverInvalidRequest, groupByDate } from "../../../utils";
import { HttpCodeEnum } from "../../../enums/server";
import validate from "./validate";
import EmailService from "../../../utils/email";
import Logger from "../../../utils/logger";
import ServerMessages, { ServerMessagesEnum } from "../../../config/messages";

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
            const result: any = await Product.findOne({ id: id }).populate('category_id', 'id name').populate('unit_id', 'id name shortname').lean();

            if (result) {
                const formattedResult = {
                    id: result.id,
                    name: result.name,
                    description: result.description,
                    category_id: result.category_id,
                    offer_units: result.offer_units,
                    unit_id: result.unit_id,
                    packs: result.packs,
                    master_packs: result.master_packs,
                    trade_units: result.trade_units,
                    product_image: `${process.env.RESOURCE_URL}${result.product_image}`,
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

            const { name, description, category_id, unit_id, packs, master_packs, trade_units, offer_units, status } = req.body;
            // console.log(req.body.attributes);
            let result: any;
            const categoryid = parseInt(category_id);
            const unitid = parseInt(unit_id);
            const category: any = await Category.findOne({ id: categoryid }).lean();
            const units: any = await Unit.findOne({ id: unitid }).lean();
            console.log(category)
            console.log(units)
            if (category) {
                result = await Product.create({
                    name: name,
                    description: description,
                    category_id: category._id,
                    unit_id: units._id,
                    packs: JSON.parse(packs),
                    master_packs: JSON.parse(master_packs),
                    trade_units: JSON.parse(trade_units),
                    offer_units: JSON.parse(offer_units),
                    status: status
                });
                if (result) {
                    let product_image: any;
                    if (req.file) {
                        product_image = req?.file?.filename;
                        let resultimage: any = await Product.findOneAndUpdate({ id: result.id }, { product_image: product_image });
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
            const { name, description, category_id, unit_id, packs, master_packs, trade_units, offer_units, status } = req.body;
            const categoryid = parseInt(category_id);
            const unitid = parseInt(unit_id);

            const category: any = await Category.findOne({ id: categoryid }).lean();
            const units: any = await Unit.findOne({ id: unitid }).lean();
            let result: any = await Product.findOneAndUpdate(
                { id: id },
                {
                    name: name,
                    description: description,
                    category_id: category._id,
                    unit_id: units._id,
                    packs: JSON.parse(packs),
                    master_packs: JSON.parse(master_packs),
                    trade_units: JSON.parse(trade_units),
                    offer_units: JSON.parse(offer_units),
                    status: status
                });
            let product_image: any;
            if (req.file) {
                product_image = req?.file?.filename;
                let resultimage: any = await Product.findOneAndUpdate({ id: result.id }, { product_image: product_image });
            }
            const updatedData: any = await Product.find({ id: id }).lean();

            return serverResponse(res, HttpCodeEnum.OK, constructResponseMsg(this.locale, "product-update"), updatedData);
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