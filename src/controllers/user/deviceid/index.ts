import { Request, Response } from "express";
import ServerMessages, { ServerMessagesEnum } from "../../../config/messages";
import { HttpCodeEnum } from "../../../enums/server";
import { serverResponse, serverErrorHandler, constructResponseMsg } from "../../../utils";
import { Customer, Deviceid } from "../../../models";
import { prepareNotificationData, prepareWhatsAppNotificationData } from "../../../utils/notification-center";

export default class BannerController {
    public locale: string = "en";
    private appURL: string = process.env.APP_URL || "";

    constructor() {}

    private async newUserNotification(userId: string): Promise<any> {
        try {
            const user: any = await Customer.findOne({ _id: userId }).lean();
            const notificationData = {
                tmplt_name: "new_user_loggin",
                to: userId,
                dynamicKey: {},
            };
            const whatsAppData = {
                campaignName: "New User Profile Complete",
                userName: user?.name||"New User",
                destination: user?.whatapp_num || user?.phone,
                templateParams: ['test'],
            };

            if (user?.is_user_new) {
                prepareNotificationData(notificationData);
                prepareWhatsAppNotificationData(whatsAppData);

            }
        } catch (error) {}
    }

    public async update(req: Request, res: Response): Promise<any> {
        try {
            // Set locale
            const { locale } = req.query;
            this.locale = (locale as string) || "en";
            const { device_id, type } = req.body;

            // Check if the device_id already exists for the user
            const existingDevice: any = await Deviceid.findOne({ device_id, type, created_by: req.customer.object_id });

            if (!existingDevice) {
                // console.log("Adding new device");

                const addDevice = await Deviceid.create({ device_id, type, created_by: req.customer.object_id });

                // console.log(addDevice);
                this.newUserNotification(req.customer.object_id);

                return serverResponse(res, HttpCodeEnum.OK, constructResponseMsg(this.locale, "deviceid-add"), {});
            } else {
                // console.log("Updating existing device");
                existingDevice.device_id = device_id;
                existingDevice.type = type;
                await existingDevice.save();
                this.newUserNotification(req.customer.object_id);
                return serverResponse(res, HttpCodeEnum.OK, constructResponseMsg(this.locale, "deviceid-update"), {});
            }
        } catch (err: any) {
            return serverErrorHandler(err, res, err.message);
        }
    }
}
