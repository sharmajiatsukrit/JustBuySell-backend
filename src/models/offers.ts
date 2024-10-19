import { Document, Schema, model } from 'mongoose';
import { BillingGatewayEnum } from "../enums";
import { BillingAdressType } from "../interfaces";
import { autoIncrement } from 'mongoose-plugin-autoinc';

interface IOffers extends Document {
    product_id: string;

    target_price: number;
    buy_quantity: number;
    product_location: string;
    offer_price: number;
    moq: string;
    brand: string;
    coo: string;
    type:number;
    attributes: string;
    status: number;
    created_by: number;
    updated_by: number;
}

const offersSchema: Schema = new Schema({

    product_id: { type: Schema.Types.ObjectId, ref: 'products' },
    target_price: { type: Number, default: '' },
    buy_quantity: { type: Number, default: '' },
    product_location: { type: String, default: '' },
    offer_price: { type: Number, default: 0 },
    moq: { type: Number, default: 0 },
    brand: { type: String, default: '' },
    coo: { type: String, default: '' },
    attributes: { type: Map, of: Array, default: {} }, // Dynamic attributes
    status: { type: Number, default: 1 },
    type: { type: String, default: 0 },
    created_by: { type: Schema.Types.ObjectId, ref: 'customers' },
    updated_by: { type: Schema.Types.ObjectId, ref: 'customers' }
},
    {
        timestamps: true,
        versionKey: false
    });

offersSchema.plugin(autoIncrement, { model: 'offers', field: 'id', startAt: 1 });

const Offers = model<IOffers>('offers', offersSchema);

export default Offers;