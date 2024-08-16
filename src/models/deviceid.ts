import { Document, Schema, model } from 'mongoose';
import { BillingAdressType } from "../interfaces";
import { autoIncrement } from 'mongoose-plugin-autoinc';

interface IDeviceid extends Document {
    device_id: string;
    type: String;
    created_by: number;
    updated_by: number;
}

const DeviceSchema: Schema = new Schema({
    device_id: { type: String, default: '' },
    type: { type: String, default: '' },
    created_by: { type: Schema.Types.ObjectId, ref: 'customers' },
    updated_by: { type: Schema.Types.ObjectId, ref: 'customers' }
},
    {
        timestamps: true,
        versionKey: false
    });

DeviceSchema.plugin(autoIncrement, { model: 'deviceids', field: 'id', startAt: 1 });

const Deviceid = model<IDeviceid>('deviceids', DeviceSchema);

export default Deviceid;