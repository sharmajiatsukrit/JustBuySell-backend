import { Document, Schema, model } from 'mongoose';
import { BillingGatewayEnum } from "../enums";
import { BillingAdressType } from "../interfaces";
import { autoIncrement } from 'mongoose-plugin-autoinc';

interface ISetting extends Document {
    key:string;
    value:any;
    created_by: string;
    updated_by: string;
}

const SettingSchema: Schema = new Schema({

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