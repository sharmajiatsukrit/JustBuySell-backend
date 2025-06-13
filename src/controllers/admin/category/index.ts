import { Request, Response } from "express";
import { ValidationChain } from "express-validator";
import moment from "moment";
import { Category } from "../../../models";
import { removeObjectKeys, serverResponse, serverErrorHandler, removeSpace, constructResponseMsg, serverInvalidRequest, groupByDate } from "../../../utils";
import { HttpCodeEnum } from "../../../enums/server";
import validate from "./validate";
import EmailService from "../../../utils/email";
import Logger from "../../../utils/logger";
import ServerMessages, { ServerMessagesEnum } from "../../../config/messages";
import { log } from "winston";

const fileName = "[admin][category][index.ts]";
export default class CategoryController {
    public locale: string = "en";
    public emailService;

    constructor() {
        this.emailService = new EmailService();
    }

    public validate(endPoint: string): ValidationChain[] {
        return validate(endPoint);
    }


    // Checked
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
            const results = await Category.find(searchQuery)
                .sort({ _id: -1 }) // Sort by _id in descending order
                .skip(skip)
                .limit(limitNumber)
                .lean().populate("parent_id","id name");

            // Get the total number of documents in the Category collection
            const totalCount = await Category.countDocuments(searchQuery);

            // Calculate total pages
            const totalPages = Math.ceil(totalCount / limitNumber);

            if (results.length > 0) {
                // Format each item in the result array
                const formattedResults = results.map((item, index) => ({
                    id: item.id, // Generate a simple sequential ID starting from 1
                    name: item.name,
                    description: item.description,
                    parent_id: item.parent_id,
                    commission: item.commission,
                    catImg: `${process.env.RESOURCE_URL}${item.cat_img}`, // Full URL of category image
                    status: item.status,
                    // Add more fields as necessary
                }));

                return serverResponse(
                    res,
                    HttpCodeEnum.OK,
                    ServerMessages.errorMsgLocale(this.locale, ServerMessagesEnum["category-fetched"]),
                    { data: formattedResults, totalCount, totalPages, currentPage: pageNumber }
                );
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
            // Set locale
            const { locale } = req.query;
            this.locale = (locale as string) || "en";

            const id = parseInt(req.params.id);

            // Find category by id and fetch details
            const result: any = await Category.findOne({ id }).lean().populate("parent_id","id name");

            if (result) {
                // Construct full URL for category image
                const categoryImgUrl = `${process.env.RESOURCE_URL}${result.cat_img}`;

                // Format the result to include the full image URL
                const formattedResult = {
                    ...result,
                    category_img: categoryImgUrl
                };

                return serverResponse(res, HttpCodeEnum.OK, ServerMessages.errorMsgLocale(this.locale, ServerMessagesEnum["category-fetched"]), formattedResult);
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
            // Set locale
            const { locale } = req.query;
            this.locale = (locale as string) || "en";

            const { name, description, parent_id,commission, status } = req.body;

            const existingCategoryName = await Category.findOne({name: name }).lean();
            if (existingCategoryName) {
                console.log("Category with this name already exists");
                return serverInvalidRequest(req, res, "Category with this name already exists");
            }

            const category: any = await Category.findOne({ id: parent_id }).lean();
            console.log(category);
            
            const result: any = await Category.create({
                name: name,
                description: description,
                commission: commission,
                parent_id: parent_id ? category._id : null,
                status: status,
                created_by: req.user.object_id
            });

            if (result) {
                let cat_img: any;
                if (req.file) {
                    cat_img = req?.file?.filename;
                    let resultimage: any = await Category.findOneAndUpdate({ id: result.id }, { cat_img: cat_img });
                }
                return serverResponse(res, HttpCodeEnum.OK, constructResponseMsg(this.locale, "category-add"), {});
            } else {
                throw new Error(ServerMessages.errorMsgLocale(this.locale, ServerMessagesEnum["not-found"]));
            }

        } catch (err: any) {
            return serverErrorHandler(err, res, err.message, HttpCodeEnum.SERVERERROR, {});
        }
    }

    //Update
    public async update(req: Request, res: Response): Promise<any> {
        try {
            const fn = "[update]";

            const id = parseInt(req.params.id);
            Logger.info(`${fileName + fn} category_id: ${id}`);

            // Set locale
            const { locale } = req.query;
            this.locale = (locale as string) || "en";
            const { name, description, parent_id,commission, status } = req.body;
            const category: any = await Category.findOne({ id: parent_id }).lean();
            let result: any = await Category.findOneAndUpdate(
                { id: id },
                {
                    name: name,
                    description: description,
                    commission: commission,
                    parent_id: parent_id ? category._id : null,
                    status: status,
                    updated_by: req.user.object_id
                });
            let cat_img: any;
            if (req.file) {
                cat_img = req?.file?.filename;
                let resultimage: any = await Category.findOneAndUpdate({ id: result.id }, { cat_img: cat_img });
            }
            const updatedData: any = await Category.findOne({ id: id }).lean();

            return serverResponse(res, HttpCodeEnum.OK, constructResponseMsg(this.locale, "category-update"), updatedData);
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
            const result = await Category.deleteOne({ id: id });

            if (result) {
                return serverResponse(res, HttpCodeEnum.OK, ServerMessages.errorMsgLocale(this.locale, ServerMessagesEnum["category-delete"]), result);
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
            const updationstatus = await Category.findOneAndUpdate({ id: id }, { status: status }).lean();
            const updatedData: any = await Category.findOne({ id: id }).lean();
            if (updationstatus) {
                return serverResponse(res, HttpCodeEnum.OK, ServerMessages.errorMsgLocale(this.locale, ServerMessagesEnum["category-status"]), updatedData);
            } else {
                throw new Error(ServerMessages.errorMsgLocale(this.locale, ServerMessagesEnum["not-found"]));
            }
        } catch (err: any) {
            return serverErrorHandler(err, res, err.message, HttpCodeEnum.SERVERERROR, {});
        }
    }

}