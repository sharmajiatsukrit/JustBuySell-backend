import { Document, Schema, model } from 'mongoose';
import { BillingGatewayEnum } from "../enums";
import { BillingAdressType } from "../interfaces";
import { autoIncrement } from 'mongoose-plugin-autoinc';

interface ISetting extends Document {
    // app_name: string;
    // support_email: string;
    // support_phone: string;
    // office_address: string;
    key:string;
    value:any;
    created_by: string;
    updated_by: string;
}

const SettingSchema: Schema = new Schema({

    // app_name: { type: String, default: '' },
    // support_email: { type: String, default: '' },
    // support_phone: { type: String, default: '' },
    // office_address: { type: String, default: '' },
    key: { type: String, required: true, unique: true },
    value: { type: Schema.Types.Mixed, required: true },
    created_by: { type: Schema.Types.ObjectId, ref: 'users' },
    updated_by: { type: Schema.Types.ObjectId, ref: 'users' }
},
    {
        timestamps: true,
        versionKey: false
    });

SettingSchema.plugin(autoIncrement, { model: 'settings', field: 'id', startAt: 1 });

const Setting = model<ISetting>('settings', SettingSchema);

export default Setting;