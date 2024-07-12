import { Request, Response } from "express";
import { ValidationChain } from "express-validator";
import { Banner } from "../../../models";
import { serverResponse, serverErrorHandler } from "../../../utils";
import { HttpCodeEnum } from "../../../enums/server";
import validate from "./validate";
import ServerMessages, { ServerMessagesEnum } from "../../../config/messages";

export default class BannerController {
    public locale: string = "en";

    public validate(endPoint: string): ValidationChain[] {
        return validate(endPoint);
    }

    public async getList(req: Request, res: Response): Promise<any> {
        try {
            const { locale } = req.query;
            this.locale = (locale as string) || "en";

            const result = await Banner.find({}).sort({ id: -1 }).lean();
            const totalCount = await Banner.countDocuments({});

            if (result.length > 0) {
                const formattedResult = result.map((item: any) => ({
                    id: item.id,
                    name: item.name,
                    bannerimg: `${process.env.APP_URL}/${item.bannerimg}`,
                    url: item.url,
                    status: item.status,
                }));

                return serverResponse(
                    res,
                    HttpCodeEnum.OK,
                    ServerMessages.errorMsgLocale(this.locale, ServerMessagesEnum["banner-fetched"]),
                    { result: formattedResult, totalCount }
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
            const { locale } = req.query;
            this.locale = (locale as string) || "en";

            const id = parseInt(req.params.id);
            const result = await Banner.findOne({ id }).lean();

            if (result) {
                const formattedResult = {
                    id: result.id,
                    name: result.name,
                    bannerimg: `${process.env.APP_URL}/${result.bannerimg}`,
                    url: result.url,
                    status: result.status,
                };

                return serverResponse(res, HttpCodeEnum.OK, ServerMessages.errorMsgLocale(this.locale, ServerMessagesEnum["banner-fetched"]), formattedResult);
            } else {
                throw new Error(ServerMessages.errorMsgLocale(this.locale, ServerMessagesEnum["not-found"]));
            }
        } catch (err: any) {
            return serverErrorHandler(err, res, err.message, HttpCodeEnum.SERVERERROR, {});
        }
    }

    public async addBanner(req: Request, res: Response): Promise<any> {
        try {
            const { locale } = req.query;
            this.locale = (locale as string) || "en";

            const { name } = req.body;

            let bannerimg: string | undefined;
            if (req.files && typeof req.files === 'object') {
                if ('bannerimg' in req.files) {
                    const files = req.files as { [fieldname: string]: Express.Multer.File[] };
                    if (Array.isArray(files['bannerimg']) && files['bannerimg'].length > 0) {
                        bannerimg = files['bannerimg'][0].path;
                    }
                }
            }

            const banneradd = await Banner.create({
                id: await this.generateNextBannerId(),
                name: name,
                bannerimg: bannerimg
            });

            if (banneradd) {
                return serverResponse(res, HttpCodeEnum.OK, ServerMessages.errorMsgLocale(this.locale, ServerMessagesEnum["bannerimg-create"]), {});
            } else {
                throw new Error(ServerMessages.errorMsgLocale(this.locale, ServerMessagesEnum["update-failed"]));
            }
        } catch (err: any) {
            return serverErrorHandler(err, res, err.message, HttpCodeEnum.SERVERERROR, {});
        }
    }

    public async updateBanner(req: Request, res: Response): Promise<any> {
        try {
            const { locale } = req.query;
            this.locale = (locale as string) || "en";

            const { name } = req.body;
            const { id } = req.params;

            let bannerimg: string | undefined;
            if (req.files && typeof req.files === 'object') {
                if ('bannerimg' in req.files) {
                    const files = req.files as { [fieldname: string]: Express.Multer.File[] };
                    if (Array.isArray(files['bannerimg']) && files['bannerimg'].length > 0) {
                        bannerimg = files['bannerimg'][0].path;
                    }
                }
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

            const updatedBanner = await bannerToUpdate.save();

            if (updatedBanner) {
                return serverResponse(res, HttpCodeEnum.OK, ServerMessages.errorMsgLocale(this.locale, ServerMessagesEnum["bannerimg-update"]), {});
            } else {
                throw new Error(ServerMessages.errorMsgLocale(this.locale, ServerMessagesEnum["update-failed"]));
            }
        } catch (err: any) {
            return serverErrorHandler(err, res, err.message, HttpCodeEnum.SERVERERROR, {});
        }
    }

    public async deleteBanner(req: Request, res: Response): Promise<any> {
        try {
            const { locale } = req.query;
            this.locale = (locale as string) || "en";

            const { id } = req.params;

            const banner = await Banner.findOne({ id: id });

            if (banner) {
                await banner.deleteOne();
                return serverResponse(res, HttpCodeEnum.OK, ServerMessages.errorMsgLocale(this.locale, ServerMessagesEnum["bannerimg-delete"]), {});
            } else {
                throw new Error(ServerMessages.errorMsgLocale(this.locale, ServerMessagesEnum["update-failed"]));
            }
        } catch (err: any) {
            return serverErrorHandler(err, res, err.message, HttpCodeEnum.SERVERERROR, {});
        }
    }

    public async updateBannerStatus(req: Request, res: Response): Promise<any> {
        try {
            const { locale } = req.query;
            this.locale = (locale as string) || "en";

            const { id } = req.params;
            const { status } = req.body;

            const banner = await Banner.findOne({ id: id });

            if (banner) {
                banner.status = status;
                await banner.save();

                return serverResponse(res, HttpCodeEnum.OK, ServerMessages.errorMsgLocale(this.locale, ServerMessagesEnum["banner-status-update"]), {});
            } else {
                throw new Error(ServerMessages.errorMsgLocale(this.locale, ServerMessagesEnum["update-failed"]));
            }
        } catch (err: any) {
            return serverErrorHandler(err, res, err.message, HttpCodeEnum.SERVERERROR, {});
        }
    }

    private async generateNextBannerId(): Promise<number> {
        const lastBanner = await Banner.findOne().sort({ id: -1 });
        return lastBanner ? lastBanner.id + 1 : 1;
    }
}
