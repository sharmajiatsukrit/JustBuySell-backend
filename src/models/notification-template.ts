import { Document, Schema, model } from 'mongoose';
import { autoIncrement } from 'mongoose-plugin-autoinc';
import { User } from ".";
import { UserPermssionType } from "../enums/user";

interface INotificationTemplate extends Document {
    name: string;
    content: string;
    type: number;
    status: boolean;
    created_by: number;
    updated_by: number
}

const notificationtemplateSchema: Schema = new Schema({
    name: { type: String, default: '' },
    content: { type: String, default: '' },
    type: { type: Number, default: 0 },
    status: { type: Boolean, default: true },
    created_by: { type: Schema.Types.ObjectId, ref: 'users' },
    updated_by: { type: Schema.Types.ObjectId, ref: 'users' }
},
    {
        timestamps: true,
        versionKey: false
    });
// permissionSchema.index({ user_id: 1, invite_type: 1 });
// permissionSchema.index({ subscriber_id: 1, user_id: 1 });
notificationtemplateSchema.plugin(autoIncrement, { model: 'notification_templates', field: 'id', startAt: 1 });

const NotificationTemplate = model<INotificationTemplate>('notification_templates', notificationtemplateSchema);

export default NotificationTemplate;