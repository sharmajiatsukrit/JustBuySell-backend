import { Document, Schema, model } from 'mongoose';
import { BillingGatewayEnum } from "../enums";
import { BillingAdressType } from "../interfaces";
import { autoIncrement } from 'mongoose-plugin-autoinc';

interface ICity extends Document {
    name: string;
    state_id: number;
    status: boolean;
    created_by: number;
    updated_by: number;
}

const citySchema: Schema = new Schema({
    
    name: { type: String, default: '' },
    state_id: { type: String, default: '' },
    status: { type: Boolean, default: true },
    created_by: { type: Number, default: 0 },
    updated_by: { type: Number, default: 0 }
},
{
    timestamps: true,
    versionKey: false
});

citySchema.plugin(autoIncrement, { model: 'city', field: 'id', startAt: 1 });

const Category = model<ICity>('city', citySchema);

export default Category;