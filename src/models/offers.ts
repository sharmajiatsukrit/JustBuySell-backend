import { Document, Schema, model } from 'mongoose';
import { BillingGatewayEnum } from "../enums";
import { BillingAdressType } from "../interfaces";
import { autoIncrement } from 'mongoose-plugin-autoinc';

interface IOffers extends Document {
    productid: string;
    priceperunit: number;
    miniquantity: number;
    origin: number;
    pin: number;
    type: string;
    status: number;
    created_by: number;
    updated_by: number;
}

const offersSchema: Schema = new Schema({

    productid: { type: String, default: '' },
    priceperunit: { type: Number, default: '' },
    miniquantity: { type: Number, default: '' },
    origin: { type: Number, default: 0 },
    pin: { type: Number, default: 0 },
    status: { type: Number, default: 0 },
    type: { type: String, default: 0 },
    created_by: { type: Schema.Types.ObjectId, ref: 'users' },
    updated_by: { type: Schema.Types.ObjectId, ref: 'users' }
},
    {
        timestamps: true,
        versionKey: false
    });

offersSchema.plugin(autoIncrement, { model: 'offers', field: 'id', startAt: 1 });

const Offers = model<IOffers>('offers', offersSchema);

export default Offers;