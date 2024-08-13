import camelcaseKeys from "camelcase-keys";
import { NotificationType } from "../../enums/notification";
import { NotificationResourceType } from "../../interfaces/notification";
import { Notifications } from "../../models";

const notifcationCacheKey = "user:notification:";
const notifcationStarredCacheKey = "user:starred:notification:";

export default class NotificationApi {

    static async createNewNotfication(
        customer_id: any,
        title: string,
        message: string,
    ) {
        try {
            const notification = await Notifications.create({
                customer_id,
                title,
                message,
            });

            return Promise.resolve(notification);
        } catch (err) {
            return Promise.reject(err);
        }
    }

    static async fetchAllNotification(customer_id: any) {
        return await Notifications.find({ customer_id: customer_id }).lean().exec();
    }

}
