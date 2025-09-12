import { Document, Schema, model } from 'mongoose';
import { autoIncrement } from 'mongoose-plugin-autoinc';
import { User } from ".";
import { UserPermssionType } from "../enums/user";

interface INotificationTemplate extends Document {
    name: string;
    is_sms:boolean;
    sms_content: string;
    is_email:boolean;
    email_content: string;
    is_firebase:boolean;
    firebase_content: string;
    is_whatsapp:boolean;
    whatsapp_content: string;
    status: boolean;
    created_by: number;
    updated_by: number
}

const notificationtemplateSchema: Schema = new Schema({
    name: { type: String, default: '' },
    is_sms: { type: Boolean, default: false },
    sms_content: { type: String, default: '' },
    is_email: { type: Boolean, default: false },
    email_content: { type: String, default: '' },
    is_firebase: { type: Boolean, default: false },
    firebase_content: { type: String, default: '' },
    is_whatsapp: { type: Boolean, default: false },
    whatsapp_content: { type: String, default: '' },
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