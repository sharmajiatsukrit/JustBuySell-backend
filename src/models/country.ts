import { Document, Schema, model } from 'mongoose';
import { BillingGatewayEnum } from "../enums";
import { BillingAdressType } from "../interfaces";
import { autoIncrement } from 'mongoose-plugin-autoinc';

interface ICountry extends Document {
    name: string;
    status: boolean;
    created_by: number;
    updated_by: number;
}

const countrySchema: Schema = new Schema({

    name: { type: String, default: '' },
    status: { type: Boolean, default: true },
    created_by: { type: Schema.Types.ObjectId, ref: 'users' },
    updated_by: { type: Schema.Types.ObjectId, ref: 'users' }
},
    {
        timestamps: true,
        versionKey: false
    });

countrySchema.plugin(autoIncrement, { model: 'countries', field: 'id', startAt: 1 });

const Country = model<ICountry>('countries', countrySchema);

export default Country;