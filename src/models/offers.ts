import { Document, Schema, model } from 'mongoose';
import { BillingGatewayEnum } from "../enums";
import { BillingAdressType } from "../interfaces";
import { autoIncrement } from 'mongoose-plugin-autoinc';

interface IOffers extends Document {
    name: string;
    priseperunit: number;
    miniquantity: number;
    countryoforigin: string;
    pin: number;
    status: number;
    created_by: number;
    updated_by: number;
}

const offersSchema: Schema = new Schema({
    
    name: { type: String, default: '' },
    priseperunit: { type: Number, default: '' },
    miniquantity: { type: Number, default: '' },
    countryoforigin: { type: String, default: 0 },
    pin: { type: Number, default: 0 },
    status: { type: Number, default: 0 },
    created_by: { type: Number, default: 0 },
    updated_by: { type: Number, default: 0 }
},
{
    timestamps: true,
    versionKey: false
});

offersSchema.plugin(autoIncrement, { model: 'offers', field: 'id', startAt: 1 });

const Offers = model<IOffers>('offers', offersSchema);

export default Offers;