import { Request, Response } from "express";
import { ValidationChain } from "express-validator";
import moment from "moment";
import { Customer, ProductRequest } from "../../../models";
import { removeObjectKeys, serverResponse, serverErrorHandler, removeSpace, constructResponseMsg, serverInvalidRequest, groupByDate } from "../../../utils";
import { HttpCodeEnum } from "../../../enums/server";
import validate from "./validate";
import EmailService from "../../../utils/email";
import Logger from "../../../utils/logger";
import ServerMessages, { ServerMessagesEnum } from "../../../config/messages";
import { prepareNotificationData, prepareWhatsAppNotificationData } from "../../../utils/notification-center";
import path from "path";
import fs from "fs";
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
    // list
    public async getList(req: Request, res: Response): Promise<any> {
        try {
            const { locale, page, limit, search } = req.query;
            this.locale = (locale as string) || "en";

            const pageNumber = parseInt(page as string) || 1;
            const limitNumber = parseInt(limit as string) || 10;
            const skip = (pageNumber - 1) * limitNumber;
            const orConditions: any = [{ name: { $regex: search, $options: "i" } }, { "created_by.name": { $regex: search, $options: "i" } }];

            const searchAsNumber = Number(search);

            if (!isNaN(searchAsNumber)) {
                orConditions.push({ id: +searchAsNumber });
            }
            let matchQuery: any = {};

            if (search) {
                matchQuery.$or = orConditions;
            }
            const pipeline: any[] = [
                {
                    $lookup: {
                        from: "customers",
                        localField: "created_by",
                        foreignField: "_id",
                        as: "created_by",
                    },
                },
                { $unwind: { path: "$created_by", preserveNullAndEmptyArrays: true } },
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
                        "created_by.id": 1,
                        "created_by.name": 1,
                    },
                },
            ];

            const results = await ProductRequest.aggregate(pipeline);
            // const results = await ProductRequest.find(searchQuery)
            //     .sort({ _id: -1 }) // Sort by _id in descending order
            //     .skip(skip)
            //     .populate("created_by", "id name")
            //     .limit(limitNumber)
            //     .lean();

            const totalCountResult = await ProductRequest.aggregate([
                { $lookup: { from: "customers", localField: "created_by", foreignField: "_id", as: "created_by" } },
                { $unwind: { path: "$created_by", preserveNullAndEmptyArrays: true } },
                { $match: matchQuery },
                { $count: "total" },
            ]);

            const totalCount = totalCountResult[0]?.total || 0;
            const totalPages = Math.ceil(totalCount / limitNumber);

            if (results.length > 0) {
                // Format each item in the result array
                const formattedResults = results.map((item, index) => ({
                    id: item.id,
                    name: item.name,
                    description: item.description,
                    product_image: `${process.env.RESOURCE_URL}${item.product_image}`, // Full URL of category image
                    status: item.status,
                    created_by: item?.created_by ? { id: item.created_by.id, name: item.created_by.name } : {},
                    // Add more fields as necessary
                }));

                return serverResponse(res, HttpCodeEnum.OK, ServerMessages.errorMsgLocale(this.locale, ServerMessagesEnum["product-request-fetched"]), {
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

    //add
    public async add(req: Request, res: Response): Promise<any> {
        try {
            const fn = "[add]";
            const { locale } = req.query;
            this.locale = (locale as string) || "en";

            const { name, unitid, pack, masterpack, description, status } = req.body;

            const existingProduct = await ProductRequest.findOne({ name: name });
            if (existingProduct) {
                throw new Error(ServerMessages.errorMsgLocale(this.locale, ServerMessagesEnum["product-exist"]));
            }

            let result: any;

            result = await ProductRequest.create({
                name: name,
                unitid: unitid,
                pack: pack,
                masterpack: masterpack,
                description: description,
                status: status,
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
                { id: id },
                {
                    name: name,
                    unitid: unitid,
                    pack: pack,
                    masterpack: masterpack,
                    description: description,
                    status: status,
                }
            );

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

    //get byid list
    public async getById(req: Request, res: Response): Promise<any> {
        try {
            const fn = "[getDetailsById]";
            const { locale } = req.query;
            this.locale = (locale as string) || "en";

            const id = parseInt(req.params.id);
            const result: any = await ProductRequest.findOne({ id: id }).populate("created_by", "id name").lean();

            if (result) {
                const formattedResult = {
                    ...result,
                    product_image: `${process.env.RESOURCE_URL}${result.product_image}`,
                };
                return serverResponse(res, HttpCodeEnum.OK, constructResponseMsg(this.locale, "product-request-fetched"), formattedResult);
            } else {
                throw new Error(ServerMessages.errorMsgLocale(this.locale, ServerMessagesEnum["not-found"]));
            }
        } catch (err: any) {
            return serverErrorHandler(err, res, err.message, HttpCodeEnum.SERVERERROR, {});
        }
    }

    //get byid list
    // public async downloadProductImage(req: Request, res: Response): Promise<any> {
    //     try {
    //         const fn = "[getDetailsById]";
    //         const { locale } = req.query;
    //         this.locale = (locale as string) || "en";

    //         const id = parseInt(req.params.id);
    //         const result: any = await ProductRequest.findOne({ id: id });
    //         const download_report = `${process.env.RESOURCE_URL}${result.product_image}`;
    //         if (result) {
    //             return serverResponse(res, HttpCodeEnum.OK, constructResponseMsg(this.locale, "product-request-fetched"), { download_report });
    //         } else {
    //             throw new Error(ServerMessages.errorMsgLocale(this.locale, ServerMessagesEnum["not-found"]));
    //         }
    //     } catch (err: any) {
    //         return serverErrorHandler(err, res, err.message, HttpCodeEnum.SERVERERROR, {});
    //     }
    // }

    public async downloadProductImage(req: Request, res: Response) {
        try {
            const id = parseInt(req.params.id);
            const result: any = await ProductRequest.findOne({ id });

            if (!result || !result.product_image) {
                throw new Error("Image not found");
            }

            const uploadDir = process.env.UPLOAD_PATH;
            if (!uploadDir) {
                throw new Error("UPLOAD_PATH not defined");
            }

            // 🔥 Correct absolute file path
            const filePath = path.join(uploadDir, result.product_image);

            console.log("DOWNLOAD FILE:", filePath);

            if (!fs.existsSync(filePath)) {
                throw new Error("File not found on disk");
            }

            // 🔥 FORCE DOWNLOAD
            return res.download(filePath, result.product_image);
        } catch (err: any) {
            console.error("DOWNLOAD ERROR:", err);
            return res.status(500).json({
                status: false,
                message: err.message || "Download failed",
            });
        }
    }

    // public async downloadProductImage(req: Request, res: Response): Promise<any> {
    //     try {
    //         const id = parseInt(req.params.id);
    //         const result: any = await ProductRequest.findOne({ id });

    //         if (!result || !result.product_image) {
    //             throw new Error("Image not found");
    //         }

    //         const res_path: string = process.env.RESOURCE_PATH;

    //         const filePath = path.join(res_path, result.product_image);

    //         res.setHeader("Content-Disposition", `attachment; filename="${path.basename(filePath)}"`);
    //         res.setHeader("Content-Type", "application/octet-stream");

    //         return res.sendFile(filePath);
    //     } catch (err: any) {
    //         console.log(err);
    //         return serverErrorHandler(err, res, err.message, 500, {});
    //     }
    // }
    // status update
    public async statusUpdate(req: Request, res: Response): Promise<any> {
        try {
            const fn = "[statusUpdate]";

            const { id } = req.params;
            Logger.info(`${fileName + fn} request_id: ${id}`);

            const { locale } = req.query;
            this.locale = (locale as string) || "en";
            const { status } = req.body;

            let result: any = await ProductRequest.findOneAndUpdate(
                { id: id },
                {
                    status: status,
                }
            );
            const updatedData: any = await ProductRequest.findOne({ id: id }).lean();
            const customerData: any = await Customer.findOne({ _id: updatedData?.created_by }).lean();
            if (updatedData && status == 1) {
                const notificationData = {
                    tmplt_name: "product_add_request_processed",
                    to: customerData?._id,
                    dynamicKey: {
                        product_name: updatedData?.name,
                    },
                };
                const whatsAppData = {
                    campaignName: "Product Add Request Processed",
                    userName: customerData?.name,
                    destination: "6204591216",
                    templateParams: [updatedData?.name],
                };
                prepareNotificationData(notificationData);
                prepareWhatsAppNotificationData(whatsAppData);
            }

            return serverResponse(res, HttpCodeEnum.OK, constructResponseMsg(this.locale, "product-requested-statusupdated"), updatedData);
        } catch (err: any) {
            return serverErrorHandler(err, res, err.message, HttpCodeEnum.SERVERERROR, {});
        }
    }
}
