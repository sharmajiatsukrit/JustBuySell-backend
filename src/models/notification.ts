import { Document, Schema, model } from 'mongoose';
import { autoIncrement } from 'mongoose-plugin-autoinc';

interface INotifications extends Document {
    customer_id: number;
    title: string;
    message: string;
    read_at: string;
}

const notificationSchema: Schema = new Schema({
    customer_id: { type: Schema.Types.ObjectId, ref: 'customers' },
    title: { type: String, default: '' },
    message: { type: String, default: '' },
    read_at: { type: Date, default: null },
},
    {
        timestamps: true,
        versionKey: false
    });

notificationSchema.plugin(autoIncrement, { model: 'notifications', field: 'id', startAt: 1 });

const Notifications = model<INotifications>('notifications', notificationSchema);

export default Notifications;