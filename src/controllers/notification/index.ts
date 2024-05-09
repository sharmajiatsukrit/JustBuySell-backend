import { Request, Response } from "express";
import { serverResponse, serverErrorHandler, constructResponseMsg } from "../../utils";
import { HttpCodeEnum } from "../../enums/server";
import validate from "./validate";
import { ValidationChain } from "express-validator";
import NotificationApi from "../../utils/notification";
import { Notifications } from "../../models";
import { DateTime } from "luxon";

export default class NotificationController {
    public locale: string = "en";

    public validate(endPoint: string): ValidationChain[] {
        return validate(endPoint);
    }

    public async fetchAllNotification(req: Request, res: Response): Promise<any> {
        try {
            const { user_id } = req.user;

            // Set locale
            const { locale } = req.query;
            this.locale = (locale as string) || "en";

            const notifications = await NotificationApi.fetchAllNotification(user_id);

            return serverResponse(res, HttpCodeEnum.OK, constructResponseMsg(this.locale, "noti-ds"), notifications);
        } catch (err: any) {
            return serverErrorHandler(err, res, err.message, HttpCodeEnum.SERVERERROR, {});
        }
    }

    public async fetchStarredNotification(req: Request, res: Response): Promise<any> {
        try {
            const { user_id } = req.user;

            // Set locale
            const { locale } = req.query;
            this.locale = (locale as string) || "en";

            const notifications = await NotificationApi.fetchStarredNotification(user_id);

            return serverResponse(res, HttpCodeEnum.OK, constructResponseMsg(this.locale, "noti-ds"), notifications);
        } catch (err: any) {
            return serverErrorHandler(err, res, err.message, HttpCodeEnum.SERVERERROR, {});
        }
    }

    public async setStarredMessage(req: Request, res: Response): Promise<any> {
        try {
            const { notification_id } = req.params;

            const notificationId: string = notification_id;

            // Set locale
            const { locale } = req.query;
            this.locale = (locale as string) || "en";

            const notifications = await NotificationApi.setNotificationStarred(notificationId);

            return serverResponse(res, HttpCodeEnum.OK, constructResponseMsg(this.locale, "noti-ds"), notifications);
        } catch (err: any) {
            return serverErrorHandler(err, res, err.message, HttpCodeEnum.SERVERERROR, {});
        }
    }

    public async clearNotification(req: Request, res: Response): Promise<any> {
        try {
            interface reqBody {
                last_read_at: number;
            }

            const { user_id } = req.user;

            // Set locale
            const { locale } = req.query;
            this.locale = (locale as string) || "en";

            // Parse Body
            const { last_read_at }: reqBody = req.body;

            const lastReadAt = DateTime.fromMillis(last_read_at).toISO();

            await Notifications.deleteMany({ is_starred: false, user_id: user_id, created_at: { $lte: lastReadAt }}).lean().exec();

            return serverResponse(res, HttpCodeEnum.OK, "Notifications cleared", []);
        } catch (err: any) {
            return serverErrorHandler(err, res, err.message, HttpCodeEnum.SERVERERROR, {});
        }
    }

    public async clearSingleNotification(req: Request, res: Response): Promise<any> {
        try {
            const { user_id } = req.user;

            // Set locale
            const { locale } = req.query;
            this.locale = (locale as string) || "en";

            // Parse Body
            const { id } = req.params;

            const destroyResponse = await Notifications.deleteOne({ id: parseInt(id), is_starred: false}).lean().exec();

            if (destroyResponse.deletedCount === 0) throw Error("Notification clear failed");

            return serverResponse(res, HttpCodeEnum.OK, "Notifications cleared", []);
        } catch (err: any) {
            return serverErrorHandler(err, res, err.message, HttpCodeEnum.SERVERERROR, {});
        }
    }
}
