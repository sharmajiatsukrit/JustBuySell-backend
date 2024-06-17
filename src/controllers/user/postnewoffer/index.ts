import { Request, Response } from "express";
import { ValidationChain } from "express-validator";
import moment from "moment";
import { Offers } from "../../../models";
import { removeObjectKeys, serverResponse, serverErrorHandler, removeSpace, constructResponseMsg, serverInvalidRequest, groupByDate } from "../../../utils";
import { HttpCodeEnum } from "../../../enums/server";
import validate from "./validate";
import EmailService from "../../../utils/email";
import Logger from "../../../utils/logger";
import ServerMessages, { ServerMessagesEnum } from "../../../config/messages";

const fileName = "[admin][productrequest][index.ts]";
export default class OfferController {
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

            const { productid, priceperunit, miniquantity, origin, pin, type, status } = req.body;

            let result: any;

            result = await Offers.create({
                productid: productid,
                priceperunit: priceperunit,
                miniquantity: miniquantity,
                origin: origin,
                pin: pin,
                type: type,
                status: status
            });


            return serverResponse(res, HttpCodeEnum.OK, constructResponseMsg(this.locale, "offer-add"), result.doc);
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
            const { productid, priceperunit, miniquantity, origin, pin, type, status } = req.body;

            let result: any = await Offers.findOneAndUpdate(
                { id: id }, {
                productid: productid,
                priceperunit: priceperunit,
                miniquantity: miniquantity,
                origin: origin,
                pin: pin,
                type: type,
                status: status
            });

            const updatedData: any = await Offers.find({ id: id }).lean();

            return serverResponse(res, HttpCodeEnum.OK, constructResponseMsg(this.locale, "offer-update"), updatedData);
        } catch (err: any) {
            return serverErrorHandler(err, res, err.message, HttpCodeEnum.SERVERERROR, {});
        }
    }

    //delete
    public async delete(req: Request, res: Response): Promise<any> {
        try {
            const fn = "[delete]";
            const { locale } = req.query;
            this.locale = (locale as string) || "en";

            const { id } = req.params;
            const result = await Offers.deleteOne({ id: id });

            if (result) {
                return serverResponse(res, HttpCodeEnum.OK, constructResponseMsg(this.locale, "offer-delete"), result);
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

            const { type } = req.params;

            if (type === "2") {
                const result = await Offers.aggregate([
                    {
                        $match: { status: 1 },
                    },
                    {
                        $lookup: {
                            from: "countries",
                            localField: "origin",
                            foreignField: "id",
                            as: "countrydetails",
                        },
                    },
                    {
                        $sort: { id: -1 }
                    },
                ]).exec();

                if (result.length > 0) {
                    return serverResponse(res, HttpCodeEnum.OK, constructResponseMsg(this.locale, "offer-fetch"), result);
                } else {
                    throw new Error(ServerMessages.errorMsgLocale(this.locale, ServerMessagesEnum["not-found"]));
                }
            }
            else {
                const result = await Offers.aggregate([
                    {
                        $match: { type: type, status: 1 },
                    },
                    {
                        $lookup: {
                            from: "countries",
                            localField: "origin",
                            foreignField: "id",
                            as: "countrydetails",
                        },
                    },
                    {
                        $sort: { id: -1 }
                    },
                ]).exec();

                if (result.length > 0) {
                    return serverResponse(res, HttpCodeEnum.OK, constructResponseMsg(this.locale, "offer-fetch"), result);
                } else {
                    throw new Error(ServerMessages.errorMsgLocale(this.locale, ServerMessagesEnum["not-found"]));
                }
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
            // const result: any = await Offers.find({ id: id }).lean();
            const result = await Offers.aggregate([
                {
                    $match: { id: parseInt(id) },
                },
                {
                    $lookup: {
                        from: "countries",
                        localField: "origin",
                        foreignField: "id",
                        as: "countrydetails",
                    },
                },
            ]);

            if (result.length > 0) {
                return serverResponse(res, HttpCodeEnum.OK, constructResponseMsg(this.locale, "offer-fetch"), result);
            } else {
                throw new Error(ServerMessages.errorMsgLocale(this.locale, ServerMessagesEnum["not-found"]));
            }
        } catch (err: any) {
            return serverErrorHandler(err, res, err.message, HttpCodeEnum.SERVERERROR, {});
        }
    }

    public async offerStatus(req: Request, res: Response): Promise<Response> {
        try {
            const { locale } = req.query;
            this.locale = (locale as string) || "en";
    
            const { id } = req.params;
            const { status } = req.body;
    
            // Find the offer by ID
            const offer = await Offers.findOne({ id });
            
            // Check if the offer exists
            if (!offer) {
                return serverResponse(res, HttpCodeEnum.NOTFOUND, constructResponseMsg(this.locale, "offer-not-found"), {});
            }
    
            // Update the status
            offer.status = status;
            await offer.save();
    
            // Respond with success
            return serverResponse(res, HttpCodeEnum.OK, constructResponseMsg(this.locale, "offer-update"), {});
        } catch (err: any) {
            // Handle errors
            return serverErrorHandler(err, res, err.message, HttpCodeEnum.SERVERERROR, {});
        }
    }
} 
