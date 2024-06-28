import { Document, Schema, model } from 'mongoose';
import { BillingAdressType } from "../interfaces";
import { autoIncrement } from 'mongoose-plugin-autoinc';

interface IDeviceid extends Document {
    device_id: string;
    type: String;
    created_by: number;
    updated_by: number;
    createdAt: Date;
    updatedAt: Date;
}

const DeviceSchema: Schema = new Schema({
    device_id: { type: String, default: '' },
    type: { type: String, default: '' },
    created_by: { type: Number, default: 0 },
    updated_by: { type: Number, default: 0 }
},
{
    timestamps: true,
    versionKey: false
});

DeviceSchema.plugin(autoIncrement, { model: 'deviceid', field: 'id', startAt: 1 });

const Deviceid = model<IDeviceid>('deviceid', DeviceSchema);

export default Deviceid;