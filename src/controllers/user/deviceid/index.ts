import { Request, Response } from "express";
import ServerMessages, { ServerMessagesEnum } from "../../../config/messages";
import { HttpCodeEnum } from "../../../enums/server";
import { serverResponse, serverErrorHandler, constructResponseMsg } from "../../../utils";
import { Deviceid } from "../../../models";

export default class BannerController {
    public locale: string = "en";
    private appURL: string = process.env.APP_URL || "";

    constructor() { }

    public async update(req: Request, res: Response): Promise<any> {
        try {
            // Set locale
            const { locale } = req.query;
            this.locale = (locale as string) || "en";
    
            const { user_id: userid } = req.customer;
            const { device_id, type } = req.body;
    
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

    
}