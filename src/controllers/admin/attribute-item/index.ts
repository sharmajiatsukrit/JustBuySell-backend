import { Request, Response } from "express";
import { ValidationChain } from "express-validator";
import moment from "moment";
import { Attribute, AttributeItem } from "../../../models";
import { removeObjectKeys, serverResponse, serverErrorHandler, removeSpace, constructResponseMsg, serverInvalidRequest, groupByDate } from "../../../utils";
import { HttpCodeEnum } from "../../../enums/server";
import validate from "./validate";
import EmailService from "../../../utils/email";
import Logger from "../../../utils/logger";
import ServerMessages, { ServerMessagesEnum } from "../../../config/messages";

const fileName = "[admin][attribute-item-item][index.ts]";
export default class AttributeItemController {
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
            const fn = "[getList]";
            // Set locale
            const { locale, page, limit, search } = req.query;
            this.locale = (locale as string) || "en";

            const pageNumber = parseInt(page as string) || 1;
            const limitNumber = parseInt(limit as string) || 10;
            const skip = (pageNumber - 1) * limitNumber;
            const attribute_id = parseInt(req.params.attribute_id);
            const attribute: any = await Attribute.findOne({ id: attribute_id }).lean();
            if (!attribute) {
                return serverResponse(res, HttpCodeEnum.SERVERERROR, "Attribute Not Available to use.", {});
            }
            
            const results = await AttributeItem.find({ attribute_id: attribute._id })
                .sort({ _id: -1 }) // Sort by _id in descending order
                .skip(skip)
                .populate('attribute_id', 'id name')
                .populate('created_by', 'id name')
                .limit(limitNumber)
                .lean();

            const totalCount = await AttributeItem.countDocuments({});
            const totalPages = Math.ceil(totalCount / limitNumber);
            // const result = await State.find({}).sort([['id', 'desc']]).lean();

            if (results.length > 0) {
                return serverResponse(res, HttpCodeEnum.OK, ServerMessages.errorMsgLocale(this.locale, ServerMessagesEnum["attribute-item-fetched"]), { data: results, totalCount, totalPages, currentPage: pageNumber });
            } else {
                throw new Error(ServerMessages.errorMsgLocale(this.locale, ServerMessagesEnum["not-found"]));
            }
        } catch (err: any) {
            return serverErrorHandler(err, res, err.message, HttpCodeEnum.SERVERERROR, {});
        }
    }


    // Checked
    public async getById(req: Request, res: Response): Promise<any> {
        try {
            const fn = "[getById]";
            // Set locale
            const { locale } = req.query;
            this.locale = (locale as string) || "en";

            const id = parseInt(req.params.id);
            const result: any = await AttributeItem.findOne({ id: id }).populate('attribute_id', 'id name')
                .populate('created_by', 'id name').lean();
           
            if (result) {
                return serverResponse(res, HttpCodeEnum.OK, ServerMessages.errorMsgLocale(this.locale, ServerMessagesEnum["attribute-item-fetched"]), result);
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

            const { name, attribute_id, status } = req.body;
            // Logger.info(`${fileName + fn} req.body: ${JSON.stringify(req.body)}`);
            const attribute: any = await Attribute.findOne({ id: attribute_id }).lean();
            if (!attribute) {
                return serverResponse(res, HttpCodeEnum.SERVERERROR, "Attribute Not Available to use.", {});
            }
            let result: any;
            result = await AttributeItem.create({
                name: name,
                attribute_id: attribute._id,
                status: status,
                created_by: req.user.object_id
            });


            return serverResponse(res, HttpCodeEnum.OK, constructResponseMsg(this.locale, "attribute-item-add"), result.doc);
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
            const { name, status } = req.body;

            let result: any = await AttributeItem.findOneAndUpdate(
                { id: id },
                {
                    name: name,
                    status: status,
                    updated_by: req.user.object_id
                });

            const updatedData: any = await AttributeItem.find({ id: id }).lean();

            return serverResponse(res, HttpCodeEnum.OK, constructResponseMsg(this.locale, "attribute-item-update"), updatedData);
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
            const result = await AttributeItem.deleteOne({ id: id });

            if (result) {
                return serverResponse(res, HttpCodeEnum.OK, ServerMessages.errorMsgLocale(this.locale, ServerMessagesEnum["attribute-item-delete"]), result);
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
            const updationstatus = await AttributeItem.findOneAndUpdate({ id: id }, { status: status }).lean();
            const updatedData: any = await AttributeItem.find({ id: id }).lean();
            if (updationstatus) {
                return serverResponse(res, HttpCodeEnum.OK, ServerMessages.errorMsgLocale(this.locale, ServerMessagesEnum["attribute-item-status"]), updatedData);
            } else {
                throw new Error(ServerMessages.errorMsgLocale(this.locale, ServerMessagesEnum["not-found"]));
            }
        } catch (err: any) {
            return serverErrorHandler(err, res, err.message, HttpCodeEnum.SERVERERROR, {});
        }
    }

}