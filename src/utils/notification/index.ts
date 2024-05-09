import camelcaseKeys from "camelcase-keys";
import { NotificationType } from "../../enums/notification";
import { NotificationResourceType } from "../../interfaces/notification";
import { Notifications } from "../../models";

const notifcationCacheKey = "user:notification:";
const notifcationStarredCacheKey = "user:starred:notification:";

export default class NotificationApi {

    static async createNewNotfication(
        userId: number,
        subscriberId: number,
        message: string,
        resourceType: number = NotificationType.Message,
        resource: NotificationResourceType = {}
    ) {
        try {
            const notification = await Notifications.create({
                user_id: userId,
                subscriber_id: subscriberId,
                is_starred: false,
                message,
                resource_type: resourceType,
                resource_data: resource.resource_data,
                resource_url: resource.resource_url,
                resource_img: resource.resource_img,
                resource_file_id: resource.resource_file_id,
            });

            return Promise.resolve(notification);
        } catch (err) {
            return Promise.reject(err);
        }
    }

    static async fetchAllNotification(userId: number) {
        return await Notifications.find({ user_id: userId, read_at: null}).lean().exec();
    }

    static async fetchStarredNotification(userId: number) {
            return await Notifications.find({ user_id: userId, is_starred: true}).lean().exec();
    }

    static async setNotificationStarred(notificationId: any) {
        let notificationData = await Notifications.findById(notificationId).lean().exec();

        if (!notificationData) return Promise.reject("Notification found");

        notificationData.is_starred = !notificationData.is_starred;

        await notificationData.save();

        return Promise.resolve(notificationData.toJSON());
    }
}
