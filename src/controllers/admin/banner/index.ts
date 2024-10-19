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
            const { locale, page, limit, search } = req.query;
            this.locale = (locale as string) || "en";

            const pageNumber = parseInt(page as string) || 1;
            const limitNumber = parseInt(limit as string) || 10;
            const skip = (pageNumber - 1) * limitNumber;

            // Constructing the search query
            let searchQuery = {};
            if (search) {
                searchQuery = {
                    // isDeleted: false,
                    $or: [
                        { name: { $regex: search, $options: 'i' } } // Case-insensitive search for name
                    ]
                };
            } else {
                searchQuery = {};
            }

            const result = await Banner.find(searchQuery)
                .lean()
                .skip(skip)
                .limit(limitNumber).sort({ id: -1 });
            const totalCount = await Banner.countDocuments({});


            if (result.length > 0) {
                const formattedResult = result.map((item: any) => ({
                    id: item.id,
                    name: item.name,
                    start_date: item.start_date,
                    end_date: item.end_date,
                    banner: `${process.env.RESOURCE_URL}${item.banner}`,
                    external_url: item.external_url,
                    status: item.status,
                }));
                const totalPages = Math.ceil(totalCount / limitNumber);
                return serverResponse(
                    res,
                    HttpCodeEnum.OK,
                    ServerMessages.errorMsgLocale(this.locale, ServerMessagesEnum["banner-fetched"]),
                    { data: formattedResult, totalPages, totalCount, currentPage: pageNumber }
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
            const { locale } = req.query;
            this.locale = (locale as string) || "en";

            const id = parseInt(req.params.id);
            const result = await Banner.findOne({ id }).lean();

            if (result) {
                const formattedResult = {
                    id: result.id,
                    name: result.name,
                    start_date: result.start_date,
                    end_date: result.end_date,
                    banner: `${process.env.RESOURCE_URL}${result.banner}`,
                    external_url: result.external_url,
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

    public async add(req: Request, res: Response): Promise<any> {
        try {
            const { locale } = req.query;
            this.locale = (locale as string) || "en";

            const { name, external_url,start_date,end_date, status } = req.body;

            let banner: any;
            if (req.file) {
                banner = req?.file?.filename;
            } else {
                return serverResponse(res, HttpCodeEnum.SERVERERROR, "No Banner Attached", {});
            }

            const banneradd = await Banner.create({
                name: name,
                banner: banner,
                start_date: start_date,
                end_date: end_date,
                external_url: external_url,
                status: status,
                created_by: req.user.object_id
            });

            if (banneradd) {
                return serverResponse(res, HttpCodeEnum.OK, ServerMessages.errorMsgLocale(this.locale, ServerMessagesEnum["banner-add"]), {});
            } else {
                throw new Error(ServerMessages.errorMsgLocale(this.locale, ServerMessagesEnum["not-found"]));
            }
        } catch (err: any) {
            return serverErrorHandler(err, res, err.message, HttpCodeEnum.SERVERERROR, {});
        }
    }

    public async update(req: Request, res: Response): Promise<any> {
        try {
            const { locale } = req.query;
            this.locale = (locale as string) || "en";

            const { name, external_url,start_date,end_date, status } = req.body;
            const { id } = req.params;
            console.log({ name, external_url,start_date,end_date, status });
            let banner: any;
            if (req.file) {
                banner = req?.file?.filename;
                let result: any = await Banner.findOneAndUpdate({ id: id }, { banner: banner });
            }

            let result: any = await Banner.findOneAndUpdate(
                { id: id },
                {
                    name: name,
                    external_url: external_url,
                    start_date: start_date,
                    end_date: end_date,
                    status: status,
                    updated_by: req.user.object_id
                });

            const updatedData: any = await Banner.find({ id: id }).lean();

            if (result) {
                return serverResponse(res, HttpCodeEnum.OK, ServerMessages.errorMsgLocale(this.locale, ServerMessagesEnum["banner-update"]), {});
            } else {
                throw new Error(ServerMessages.errorMsgLocale(this.locale, ServerMessagesEnum["server-error"]));
            }
        } catch (err: any) {
            return serverErrorHandler(err, res, err.message, HttpCodeEnum.SERVERERROR, {});
        }
    }

    public async delete(req: Request, res: Response): Promise<any> {
        try {
            const { locale } = req.query;
            this.locale = (locale as string) || "en";

            const { id } = req.params;

            const banner = await Banner.findOne({ id: id });

            if (banner) {
                await banner.deleteOne();
                return serverResponse(res, HttpCodeEnum.OK, ServerMessages.errorMsgLocale(this.locale, ServerMessagesEnum["banner-delete"]), {});
            } else {
                throw new Error(ServerMessages.errorMsgLocale(this.locale, ServerMessagesEnum["not-found"]));
            }
        } catch (err: any) {
            return serverErrorHandler(err, res, err.message, HttpCodeEnum.SERVERERROR, {});
        }
    }

    public async updateStatus(req: Request, res: Response): Promise<any> {
        try {
            const { locale } = req.query;
            this.locale = (locale as string) || "en";

            const { id } = req.params;
            const { status } = req.body;

            const banner = await Banner.findOne({ id: id });

            if (banner) {
                banner.status = status;
                await banner.save();

                return serverResponse(res, HttpCodeEnum.OK, ServerMessages.errorMsgLocale(this.locale, ServerMessagesEnum["banner-status"]), {});
            } else {
                throw new Error(ServerMessages.errorMsgLocale(this.locale, ServerMessagesEnum["not-found"]));
            }
        } catch (err: any) {
            return serverErrorHandler(err, res, err.message, HttpCodeEnum.SERVERERROR, {});
        }
    }

}
