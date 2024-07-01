import { Document, Schema, model } from 'mongoose';
import { BillingAdressType } from "../interfaces";
import { autoIncrement } from 'mongoose-plugin-autoinc';

interface ILocation extends Document {
    lat: string;
    log: string;
    address1: string;
    address2: string;
    pincode: number;
    dist: string;
    city: string;
    created_by: number;
    updated_by: number;
    createdAt: Date;
    updatedAt: Date;
}

const LocationSchema: Schema = new Schema({
    lat: { type: String, default: '' },
    log: { type: String, default: '' },
    address1: { type: String, default: '' },
    address2: { type: String, default: '' },
    pincode: { type: Number, default: '' },
    dist: { type: String, default: '' },
    city: { type: String, default: '' },
    created_by: { type: Number, default: 0 },
    updated_by: { type: Number, default: 0 }
},
{
    timestamps: true,
    versionKey: false
});

LocationSchema.plugin(autoIncrement, { model: 'location', field: 'id', startAt: 1 });

const Location = model<ILocation>('location', LocationSchema);

export default Location;