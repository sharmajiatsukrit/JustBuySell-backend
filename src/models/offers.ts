import { Document, Schema, model } from 'mongoose';
import { BillingGatewayEnum } from "../enums";
import { BillingAdressType } from "../interfaces";
import { autoIncrement } from 'mongoose-plugin-autoinc';

interface IOffers extends Document {
    product_id: string;
    target_price: number;
    buy_quantity: number;
    pin_code: string;
    product_location: string;
    offer_price: number;
    moq: string;
    brand: string;
    coo: string;
    type:number;
    individual_pack: string;
    master_pack: string;
    selling_unit: string;
    conversion_unit: string;
    conversion_rate: string;
    status: number;
    created_by: number;
    updated_by: number;
}

const offersSchema: Schema = new Schema({

    product_id: { type: Schema.Types.ObjectId, ref: 'products' },
    target_price: { type: Number, default: '' },
    buy_quantity: { type: Number, default: '' },
    pin_code: { type: String, default: '' },
    product_location: { type: String, default: '' },
    offer_price: { type: Number, default: 0 },
    moq: { type: Number, default: 0 },
    brand: { type: String, default: '' },
    coo: { type: String, default: '' },
    individual_pack: { type: Object, default: {} }, // Dynamic attributes
    master_pack: { type: Object, default: {} }, // Dynamic attributes
    selling_unit: { type: Object, default: {} }, // Dynamic attributes
    conversion_unit: { type: Object, default: {} }, // Dynamic attributes
    conversion_rate: { type: Object, default: {} }, // Dynamic attributes
    status: { type: Number, default: 1 },
    type: { type: String, default: 0 },
    created_by: { type: Schema.Types.ObjectId, ref: 'customers' },
    updated_by: { type: Schema.Types.ObjectId, ref: 'customers' }
},
    {
        timestamps: true,
        versionKey: false
    });
offersSchema.virtual('ratings', {
    ref: 'ratings', // Reference to the Rating model
    localField: '_id', // The offer_id in UnlockOffers corresponds to the _id in Offer
    foreignField: 'offer_id', // The offer_id in the Rating model
    justOne: true, // Set to false to retrieve an array of ratings
    });
      
      offersSchema.set('toObject', { virtuals: true });
      offersSchema.set('toJSON', { virtuals: true });
offersSchema.plugin(autoIncrement, { model: 'offers', field: 'id', startAt: 1 });

const Offers = model<IOffers>('offers', offersSchema);

export default Offers;