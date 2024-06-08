import { Request, Response } from "express";
import { ValidationChain } from "express-validator";
import validator from "validator";
import Bcrypt from "bcryptjs";
import { DateTime } from "luxon";
import moment from "moment";
import { Banner } from "../../../models";
import { removeObjectKeys, serverResponse, serverErrorHandler, removeSpace, constructResponseMsg, serverInvalidRequest, groupByDate } from "../../../utils";
import { HttpCodeEnum } from "../../../enums/server";
import validate from "./validate";
import EmailService from "../../../utils/email";
import { getPostsForAdmin, getPostsForAdminBySubscriberId, getChatCount, getPostCount, postDelete } from "../../../services/Chat";
import Logger from "../../../utils/logger";
import ServerMessages, { ServerMessagesEnum } from "../../../config/messages";
import mongoose from "mongoose";

const fileName = "[admin][banner][index.ts]";
export default class BannerController {
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
            const fn = "[getList]";
            // Set locale
            const { locale } = req.query;
            this.locale = (locale as string) || "en";


            const result = await Banner.find({}).sort([['id', 'desc']]).lean();

            if (result) {
                return serverResponse(res, HttpCodeEnum.OK, ServerMessages.errorMsgLocale(this.locale, ServerMessagesEnum["user-fetched"]), result);
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

            const result = await Banner.findOne({ id }).lean();
    
            if (result) {
                return serverResponse(res, HttpCodeEnum.OK, ServerMessages.errorMsgLocale(this.locale, ServerMessagesEnum["user-fetched"]), result);
            } else {
                throw new Error(ServerMessages.errorMsgLocale(this.locale, ServerMessagesEnum["not-found"]));
            }
        } catch (err: any) {
            return serverErrorHandler(err, res, err.message, HttpCodeEnum.SERVERERROR, {});
        }
    }

    // add
    public async addBanner(req: Request, res: Response): Promise<any> {
        try {
            const fn = "[updateProfileImg]";
            // Set locale
            const { locale } = req.query;
            this.locale = (locale as string) || "en";
    
            const { name } = req.body;
            console.log(name);
    
            let bannerimg: string | undefined;
            if (req.files && typeof req.files === 'object') {
    
                if ('bannerimg' in req.files) {
                    const files = req.files as { [fieldname: string]: Express.Multer.File[] };
                    if (Array.isArray(files['bannerimg']) && files['bannerimg'].length > 0) {
                        bannerimg = files['bannerimg'][0].path;
                    } else {
                        console.error("Banner image file array is empty or undefined");
                    }
                } else {
                    console.error("Banner image field 'bannerimg' not found in files");
                }
            } else {
                console.error("No files found in the request");
            }
    
            const banneradd = await Banner.create({
                name: name,
                bannerimg: bannerimg
            });
    
            if (banneradd) {
                return serverResponse(res, HttpCodeEnum.OK, ServerMessages.errorMsgLocale(this.locale, ServerMessagesEnum["bannerimg-create"]), {});
            } else {
                throw new Error(ServerMessages.errorMsgLocale(this.locale, ServerMessagesEnum["update-failed"]));
            }
        } catch (err: any) {
            console.error(err);
            return serverErrorHandler(err, res, err.message, HttpCodeEnum.SERVERERROR, {});
        }
    }    


    public async updateBanner(req: Request, res: Response): Promise<any> {
        try {
            const fn = "[updateBanner]";
            const { locale } = req.query;
            this.locale = (locale as string) || "en";
    
            const { id, name } = req.body;
            console.log(name);
    
            let bannerimg: string | undefined;
            if (req.files && typeof req.files === 'object') {
                if ('bannerimg' in req.files) {
                    const files = req.files as { [fieldname: string]: Express.Multer.File[] };
                    if (Array.isArray(files['bannerimg']) && files['bannerimg'].length > 0) {
                        bannerimg = files['bannerimg'][0].path;
                    } else {
                        console.error("Banner image file array is empty or undefined");
                    }
                } else {
                    console.error("Banner image field 'bannerimg' not found in files");
                }
            } else {
                console.error("No files found in the request");
            }
    
            const bannerUpdateData: any = { name };
            if (bannerimg) {
                bannerUpdateData.bannerimg = bannerimg;
            }
    
            const bannerUpdate = await Banner.findByIdAndUpdate(parseInt(id), bannerUpdateData, { new: true });
    
            if (bannerUpdate) {
                return serverResponse(res, HttpCodeEnum.OK, ServerMessages.errorMsgLocale(this.locale, ServerMessagesEnum["bannerimg-update"]), {});
            } else {
                throw new Error(ServerMessages.errorMsgLocale(this.locale, ServerMessagesEnum["update-failed"]));
            }
        } catch (err: any) {
            console.error(err);
            return serverErrorHandler(err, res, err.message, HttpCodeEnum.SERVERERROR, {});
        }
    }
    

    public async deleteBanner(req: Request, res: Response): Promise<any> {
        try {
            const fn = "[deleteBanner]";
    
            const { locale } = req.query;
            this.locale = (locale as string) || "en";
    
            const id = parseInt(req.params.id);
    
            const bannerDelete = await Banner.findByIdAndDelete(id.toString);
    
            if (bannerDelete) {
                return serverResponse(res, HttpCodeEnum.OK, ServerMessages.errorMsgLocale(this.locale, ServerMessagesEnum["bannerimg-delete"]), {});
            } else {
                throw new Error(ServerMessages.errorMsgLocale(this.locale, ServerMessagesEnum["update-failed"]));
            }
        } catch (err: any) {
            return serverErrorHandler(err, res, err.message, HttpCodeEnum.SERVERERROR, {});
        }
    }

} 