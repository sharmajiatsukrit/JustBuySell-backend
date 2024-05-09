import { Document, Schema, model } from 'mongoose';
import { autoIncrement } from 'mongoose-plugin-autoinc';

interface INotifications extends Document {
    user_id: number;
    subscriber_id: number;
    is_starred: boolean;
    read_at: string;
    message: string;
    resource_type: number;
    resource_data: string;
    resource_url: string;
    resource_img: string;
    resource_file_id: string;
}

const notificationSchema: Schema = new Schema({
    user_id: { type: Number, default: 0 },
    subscriber_id: { type: Number, default: 0 },
    is_starred: { type: Boolean, default: false },
    read_at: { type: Date, default: null },
    message: { type: String, default: '' },
    resource_type: { type: Number },
    resource_data: { type: Object, default: {} },
    resource_url: { type: String, default: '' },
    resource_img: { type: String, default: '' },
    resource_file_id: { type: String, default: '' }
},
{
    timestamps: true,
    versionKey: false
});

notificationSchema.plugin(autoIncrement, { model: 'notifications', field: 'id', startAt: 1 });

const Notifications = model<INotifications>('notifications', notificationSchema);

export default Notifications;