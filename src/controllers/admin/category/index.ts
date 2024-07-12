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
            const { locale, page, limit } = req.query;
            this.locale = (locale as string) || "en";
    
          
            const pageNumber = parseInt(page as string) || 1;
            const limitNumber = parseInt(limit as string) || 10; 
    
         
            const skip = (pageNumber - 1) * limitNumber;
    
            // Fetch the documents with pagination and sort by _id in descending order
            const results = await Category.find({})
                .sort({ _id: -1 }) // Sort by _id in descending order
                .skip(skip)
                .limit(limitNumber)
                .lean();
    
            // Get the total number of documents in the Category collection
            const totalCount = await Category.countDocuments({});
    
            // Calculate total pages
            const totalPages = Math.ceil(totalCount / limitNumber);
    
            if (results.length > 0) {
                // Format each item in the result array
                const formattedResults = results.map((item, index) => ({
                    id: index + 1, // Generate a simple sequential ID starting from 1
                    name: item.name,
                    description: item.description,
                    catImg: `${process.env.APP_URL}/${item.cat_img}`, // Full URL of category image
                    status: item.status,
                    // Add more fields as necessary
                }));
    
                return serverResponse(
                    res,
                    HttpCodeEnum.OK,
                    ServerMessages.errorMsgLocale(this.locale, ServerMessagesEnum["category-fetched"]),
                    { result: formattedResults, totalCount, totalPages, currentPage: pageNumber }
                );
            } else {
                throw new Error(ServerMessages.errorMsgLocale(this.locale, ServerMessagesEnum["not-found"]));
            }
        } catch (err: any) {
            return serverErrorHandler(err, res, err.message, HttpCodeEnum.SERVERERROR, {});
        }
    }
    public async getDetailsById(req: Request, res: Response): Promise<any> {
        try {
            const fn = "[getDetailsById]";
            // Set locale
            const { locale } = req.query;
            this.locale = (locale as string) || "en";
    
            const id = parseInt(req.params.id);
    
            // Find category by id and fetch details
            const result: any = await Category.findOne({ id }).lean();
    
            if (result) {
                // Construct full URL for category image
                const categoryImgUrl = `${process.env.APP_URL}/${result.cat_img}`;
    
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
    
            const { name, description, parent_id, status } = req.body;
    
            let result: any;
    
            let cat_img: string | undefined;
            if (req.files && typeof req.files === 'object') {
                if ('cat_img' in req.files) {
                    const files = req.files as { [fieldname: string]: Express.Multer.File[] };
                    if (Array.isArray(files['cat_img']) && files['cat_img'].length > 0) {
                        cat_img = files['cat_img'][0].path; // Relative path of cat_img
                    } else {
                        console.error("Category image file array is empty or undefined");
                    }
                } else {
                    console.error("Category image field 'cat_img' not found in files");
                }
            } else {
                console.error("No files found in the request");
            }
    
            result = await Category.create({
                name: name,
                description: description,
                parent_id: parent_id,
                cat_img: cat_img,
                status: status
            });
    
            // Assuming result.doc contains the created document, modify cat_img to be the relative URL
            if (result.doc) {
                result.doc.cat_img = cat_img; // Assigning relative URL
            }
    
            return serverResponse(res, HttpCodeEnum.OK, constructResponseMsg(this.locale, "category-add"),{});
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
            const { name, description, parent_id, status } = req.body;

            let cat_img: string | undefined;
            if (req.files && typeof req.files === 'object') {

                if ('cat_img' in req.files) {
                    const files = req.files as { [fieldname: string]: Express.Multer.File[] };
                    cat_img = files['cat_img'][0].path;
                }
            }

            let result: any = await Category.findOneAndUpdate(
                { id: id },
                {
                    name: name,
                    description: description,
                    parent_id: parent_id,
                    cat_img: cat_img,
                    status: status
                });

            const updatedData: any = await Category.find({ id: id }).lean();

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
            const updatedData: any = await Category.find({ id: id }).lean();
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