import { Request, Response } from "express";
import { ValidationChain } from "express-validator";
import moment from "moment";
import { ProductRequest } from "../../../models";
import { removeObjectKeys, serverResponse, serverErrorHandler, removeSpace, constructResponseMsg, serverInvalidRequest, groupByDate } from "../../../utils";
import { HttpCodeEnum } from "../../../enums/server";
import validate from "./validate";
import EmailService from "../../../utils/email";
import Logger from "../../../utils/logger";
import ServerMessages, { ServerMessagesEnum } from "../../../config/messages";

const fileName = "[admin][productrequest][index.ts]";
export default class ProductRequestController {
    public locale: string = "en";
    public emailService;

    constructor() {
        this.emailService = new EmailService();
    }

    public validate(endPoint: string): ValidationChain[] {
        return validate(endPoint);
    }

    //add
    public async add(req: Request, res: Response): Promise<any> {
        try {
            const fn = "[add]";
            const { locale } = req.query;
            this.locale = (locale as string) || "en";

            const { name, unitid, pack, masterpack, description, status } = req.body;

            let result: any;

            result = await ProductRequest.create({
                name: name,
                unitid: unitid,
                pack: pack,
                masterpack: masterpack,
                description: description,
                status: status
            });


            return serverResponse(res, HttpCodeEnum.OK, constructResponseMsg(this.locale, "product-requested-add"), result.doc);
        } catch (err: any) {
            return serverErrorHandler(err, res, err.message, HttpCodeEnum.SERVERERROR, {});
        }
    }

    //update
    public async update(req: Request, res: Response): Promise<any> {
        try {
            const fn = "[update]";

            const { id } = req.params;
            Logger.info(`${fileName + fn} category_id: ${id}`);

            const { locale } = req.query;
            this.locale = (locale as string) || "en";
            const { name, unitid, pack, masterpack, description, status } = req.body;

            let result: any = await ProductRequest.findOneAndUpdate(
                { id: id }, {
                name: name,
                unitid: unitid,
                pack: pack,
                masterpack: masterpack,
                description: description,
                status: status
            });

            const updatedData: any = await ProductRequest.find({ id: id }).lean();

            return serverResponse(res, HttpCodeEnum.OK, constructResponseMsg(this.locale, "product-requested-updated"), updatedData);
        } catch (err: any) {
            return serverErrorHandler(err, res, err.message, HttpCodeEnum.SERVERERROR, {});
        }
    }

    //delete
    public async delete(req: Request, res: Response): Promise<any> {
        try {
            const fn = "[delete]";
            // Set locale
            const { locale } = req.query;
            this.locale = (locale as string) || "en";

            const { id } = req.params;
            const result = await ProductRequest.deleteOne({ id: id });

            if (result) {
                return serverResponse(res, HttpCodeEnum.OK, constructResponseMsg(this.locale, "product-requested-deleted"), result);
            } else {
                throw new Error(ServerMessages.errorMsgLocale(this.locale, ServerMessagesEnum["not-found"]));
            }
        } catch (err: any) {
            return serverErrorHandler(err, res, err.message, HttpCodeEnum.SERVERERROR, {});
        }
    }

    // list
    public async getList(req: Request, res: Response): Promise<any> {
        try {
            const fn = "[getList]";
            // Set locale
            const { locale } = req.query;
            this.locale = (locale as string) || "en";


            // const result = await ProductRequest.find({}).sort([['id', 'desc']]).lean();
            const result = await ProductRequest.aggregate([
                {
                    $lookup: {
                        from: "units",
                        localField: "unitid",
                        foreignField: "id",
                        as: "units",
                    },
                },
                {
                    $sort: { id: -1 }
                }
            ]).exec();

            if (result.length > 0) {
                return serverResponse(res, HttpCodeEnum.OK, constructResponseMsg(this.locale, "product-request-fethed"), result);
            } else {
                throw new Error(ServerMessages.errorMsgLocale(this.locale, ServerMessagesEnum["not-found"]));
            }
        } catch (err: any) {
            return serverErrorHandler(err, res, err.message, HttpCodeEnum.SERVERERROR, {});
        }
    }

    //get byid list
    public async getDetailsById(req: Request, res: Response): Promise<any> {
        try {
            const fn = "[getDetailsById]";
            const { locale } = req.query;
            this.locale = (locale as string) || "en";

            const { id } = req.params;
            // const result: any = await ProductRequest.findById( id ).lean();
            const result = await ProductRequest.aggregate([
                {
                    $match: { id: parseInt(id) },
                },
                {
                    $lookup: {
                        from: "units",
                        localField: "unitid",
                        foreignField: "id",
                        as: "units",
                    },
                },
            ]);

            if (result.length > 0) {
                return serverResponse(res, HttpCodeEnum.OK, constructResponseMsg(this.locale, "product-request-fethed"), result);
            } else {
                throw new Error(ServerMessages.errorMsgLocale(this.locale, ServerMessagesEnum["not-found"]));
            }
        } catch (err: any) {
            return serverErrorHandler(err, res, err.message, HttpCodeEnum.SERVERERROR, {});
        }
    }
} 
