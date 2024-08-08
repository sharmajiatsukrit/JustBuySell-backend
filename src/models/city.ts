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
    created_by: { type: Schema.Types.ObjectId, ref: 'users' },
    updated_by: { type: Schema.Types.ObjectId, ref: 'users' }
},
    {
        timestamps: true,
        versionKey: false
    });

citySchema.plugin(autoIncrement, { model: 'cities', field: 'id', startAt: 1 });

const Category = model<ICity>('cities', citySchema);

export default Category;