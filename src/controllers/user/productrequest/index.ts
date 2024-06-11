import { Request, Response } from "express";
import { ValidationChain } from "express-validator";
import moment from "moment";
import { Category, Product, ProductRequest } from "../../../models";
import { removeObjectKeys, serverResponse, serverErrorHandler, removeSpace, constructResponseMsg, serverInvalidRequest, groupByDate } from "../../../utils";
import { HttpCodeEnum } from "../../../enums/server";
import validate from "./validate";
import EmailService from "../../../utils/email";
import Logger from "../../../utils/logger";
import ServerMessages, { ServerMessagesEnum } from "../../../config/messages";


const fileName = "[user][product][index.ts]";
export default class ProductRequestController {
    public locale: string = "en";
    public emailService;

    constructor() {
        this.emailService = new EmailService();
    }

    public validate(endPoint: string): ValidationChain[] {
        return validate(endPoint);
    }
    

    public async add(req: Request, res: Response): Promise<any> {
        try {
            const fn = "[add]";
            const { locale } = req.query;
            this.locale = (locale as string) || "en";

            const { name, unitid, pack, masterpack, description, status } = req.body;

            let product_image: string | undefined;
            if (req.files && typeof req.files === 'object') {

                if ('product_image' in req.files) {
                    const files = req.files as { [fieldname: string]: Express.Multer.File[] };
                    product_image = files['product_image'][0].path;
                }
            }

            let result: any;

            result = await ProductRequest.create({
                name: name,
                unitid: unitid,
                pack: pack,
                masterpack: masterpack,
                description: description,
                status: status,
                productImg: product_image,
            });

            return serverResponse(res, HttpCodeEnum.OK, constructResponseMsg(this.locale, "product-requested-add"), result.doc);
        } catch (err: any) {
            return serverErrorHandler(err, res, err.message, HttpCodeEnum.SERVERERROR, {});
        }
    }

}