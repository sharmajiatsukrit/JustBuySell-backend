import { Request, Response } from "express";
import ServerMessages, { ServerMessagesEnum } from "../../../config/messages";
import { HttpCodeEnum } from "../../../enums/server";
import { serverResponse, serverErrorHandler, constructResponseMsg } from "../../../utils";
import { Deviceid } from "../../../models";

export default class BannerController {
    public locale: string = "en";
    private appURL: string = process.env.APP_URL || "";

    constructor() { }

    public async addDeviceid(req: Request, res: Response): Promise<any> {
        try {
            // Set locale
            const { locale } = req.query;
            this.locale = (locale as string) || "en";

            const { user_id: userid } = req.user;
            const { device_id } = req.body;

            const adddeviceid = await Deviceid.create({ device_id, created_by: userid });

            return serverResponse(res, HttpCodeEnum.OK, constructResponseMsg(this.locale, "deviceid-add"), {});
        } catch (err: any) {
            return serverErrorHandler(err, res, err.message);
        }
    }

    public async update(req: Request, res: Response): Promise<any> {
        try {
            // Set locale
            const { locale } = req.query;
            this.locale = (locale as string) || "en";
    
            const { user_id: userid } = req.user;
            const { device_id, type } = req.body;
    
            console.log("device_id", device_id);
    
            // Check if the device_id already exists for the user
            const existingDevice: any = await Deviceid.findOne({ device_id, type, created_by: userid });
    
            if (!existingDevice) {
                console.log("Adding new device");
    
                const addDevice = await Deviceid.create({ device_id, type, created_by: userid });
    
                console.log(addDevice);
    
                return serverResponse(res, HttpCodeEnum.OK, constructResponseMsg(this.locale, "deviceid-add"), {});
            } else {
                console.log("Updating existing device");
    
                existingDevice.device_id = device_id;
                existingDevice.type = type;
                await existingDevice.save();
    
                return serverResponse(res, HttpCodeEnum.OK, constructResponseMsg(this.locale, "deviceid-update"), {});
            }
        } catch (err: any) {
            return serverErrorHandler(err, res, err.message);
        }
    }    

    public async deleteDeviceid(req: Request, res: Response): Promise<any> {
        try {
            // Set locale
            const { locale } = req.query;
            this.locale = (locale as string) || "en";

            const { user_id: userid } = req.user;
            const id = parseInt(req.params.id);

            // Find and delete the device_id for the user
            const deletedDevice = await Deviceid.findByIdAndDelete({ id, created_by: userid });

            if (deletedDevice) {
                // If deletedDevice > 0, deletion was successful
                return serverResponse(res, HttpCodeEnum.OK, constructResponseMsg(this.locale, "deviceid-delete"), {});
            } else {
                // If deletedDevice === 0, no device_id was found to delete
                return serverResponse(res, HttpCodeEnum.BADREQUEST, constructResponseMsg(this.locale, "deviceid-not-found"), {});
            }
        } catch (err: any) {
            return serverErrorHandler(err, res, err.message);
        }
    }

    public async getDeviceid(req: Request, res: Response): Promise<any> {
        try {
            // Set locale
            const { locale, page, limit } = req.query;
            this.locale = (locale as string) || "en";

            const pageNumber = parseInt(page as string) || 1;
            const limitNumber = parseInt(limit as string) || 10;

            const { user_id: userid } = req.user;

            const skip = (pageNumber - 1) * limitNumber;

            // Find devices for the user with pagination
            const devices = await Deviceid.find({ created_by: userid })
                .skip(skip)
                .limit(limitNumber)
                .lean();

            const totalCount = await Deviceid.countDocuments({ created_by: userid });

            if (devices.length > 0) {
                const totalPages = Math.ceil(totalCount / limitNumber);
                const deviceIds = devices.map(device => ({
                    id: device.id,
                    device_id: device.device_id,
                    created_at: device.createdAt,
                    updated_at: device.updatedAt
                }));

                return serverResponse(
                    res,
                    HttpCodeEnum.OK,
                    constructResponseMsg(this.locale, "deviceid-list"),
                    { deviceIds, totalPages }
                );
            } else {
                throw new Error(ServerMessages.errorMsgLocale(this.locale, ServerMessagesEnum["not-found"]));
            }
        } catch (err: any) {
            return serverErrorHandler(err, res, err.message);
        }
    }

    
}