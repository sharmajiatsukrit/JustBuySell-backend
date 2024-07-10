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
            const { locale } = req.query;
            this.locale = (locale as string) || "en";
    
            const results = await Banner.find({})
                .sort({ id: -1 })
                .lean();
    
            const totalCount = await Banner.countDocuments({});
    
            if (results.length > 0) {
                // Format the data before sending the response
                const formattedResults = results.map(item => ({
                    id: item._id, // Assuming _id is the unique identifier in MongoDB
                    name: item.name,
                    bannerimg: `${process.env.APP_URL}/${item.bannerimg}`, // Full URL of bannerimg
                    url: item.url,
                    // Add other fields as necessary
                }));
    
                return serverResponse(
                    res,
                    HttpCodeEnum.OK,
                    ServerMessages.errorMsgLocale(this.locale, ServerMessagesEnum["banner-fetched"]),
                    { result: formattedResults, totalCount }
                );
            } else {
                throw new Error(ServerMessages.errorMsgLocale(this.locale, ServerMessagesEnum["bannerimg-not-found"]));
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
                // Construct full URL for banner image
                const imageUrl = `${process.env.APP_URL}/${result.bannerimg}`;
    
                // Format the result to include the full image URL
                const formattedResult = {
                    ...result,
                    bannerimg: imageUrl
                };
    
                return serverResponse(res, HttpCodeEnum.OK, ServerMessages.errorMsgLocale(this.locale, ServerMessagesEnum["banner-fetched"]), formattedResult);
            } else {
                throw new Error(ServerMessages.errorMsgLocale(this.locale, ServerMessagesEnum["bannerimg-not-found"]));
            }
        } catch (err: any) {
            return serverErrorHandler(err, res, err.message, HttpCodeEnum.SERVERERROR, {});
        }
    }
    

    // add
    public async addBanner(req: Request, res: Response): Promise<any> {
        try {
            const fn = "[addBanner]";
            // Set locale
            const { locale } = req.query;
            this.locale = (locale as string) || "en";
    
            const { name, url } = req.body;
    
            let bannerimg: string | undefined;
            if (req.files && typeof req.files === 'object') {
                if ('bannerimg' in req.files) {
                    const files = req.files as { [fieldname: string]: Express.Multer.File[] };
                    if (Array.isArray(files['bannerimg']) && files['bannerimg'].length > 0) {
                        bannerimg = files['bannerimg'][0].path;  // Store only the path
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
                bannerimg: bannerimg,
                url: url
            });
    
            if (banneradd) {
                return serverResponse(res, HttpCodeEnum.OK, ServerMessages.errorMsgLocale(this.locale, ServerMessagesEnum["bannerimg-create"]), {banneradd});
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
            // Set locale
            const { locale } = req.query;
            this.locale = (locale as string) || "en";
    
            const { name, url } = req.body;
            const { id } = req.params;
    
            let bannerimg: string | undefined;
            if (req.files && typeof req.files === 'object') {
                if ('bannerimg' in req.files) {
                    const files = req.files as { [fieldname: string]: Express.Multer.File[] };
                    if (Array.isArray(files['bannerimg']) && files['bannerimg'].length > 0) {
                        bannerimg = files['bannerimg'][0].path;  // Store only the path
                    } else {
                        console.error("Banner image file array is empty or undefined");
                    }
                } else {
                    console.error("Banner image field 'bannerimg' not found in files");
                }
            } else {
                console.error("No files found in the request");
            }
    
            const bannerToUpdate = await Banner.findOne({ id: id });
            if (!bannerToUpdate) {
                throw new Error(ServerMessages.errorMsgLocale(this.locale, ServerMessagesEnum["bannerimg-not-found"]));
            }
    
            if (name) {
                bannerToUpdate.name = name;
            }
    
            if (bannerimg) {
                bannerToUpdate.bannerimg = bannerimg;
            }
    
            if (url) {
                bannerToUpdate.url = url;
            }
    
            const updatedBanner = await bannerToUpdate.save();
    
            if (updatedBanner) {
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

            const { id } = req.params;

            // Find the banner by id
            const banner = await Banner.findOne({ id: id });

            if (banner) {
                // If banner is found, delete it
                await banner.deleteOne();
                return serverResponse(res, HttpCodeEnum.OK, ServerMessages.errorMsgLocale(this.locale, ServerMessagesEnum["bannerimg-delete"]), {});
            } else {
                // If banner is not found, throw an error
                throw new Error(ServerMessages.errorMsgLocale(this.locale, ServerMessagesEnum["update-failed"]));
            }
        } catch (err: any) {
            return serverErrorHandler(err, res, err.message, HttpCodeEnum.SERVERERROR, {});
        }
    }

    public async updateBannerStatus(req: Request, res: Response): Promise<any> {
        try {
            const fn = "[updateBannerStatus]";

            const { locale } = req.query;
            this.locale = (locale as string) || "en";

            const { id } = req.params;
            const { status } = req.body;

            // Find the banner by id
            const banner = await Banner.findOne({ id: id });

            if (banner) {
                // Update the status field
                banner.status = status;
                await banner.save();

                return serverResponse(res, HttpCodeEnum.OK, ServerMessages.errorMsgLocale(this.locale, ServerMessagesEnum["banner-status-update"]), {});
            } else {
                // If banner is not found, throw an error
                throw new Error(ServerMessages.errorMsgLocale(this.locale, ServerMessagesEnum["update-failed"]));
            }
        } catch (err: any) {
            return serverErrorHandler(err, res, err.message, HttpCodeEnum.SERVERERROR, {});
        }
    }
}
