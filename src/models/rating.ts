import { Document, Schema, model } from 'mongoose';
import { BillingGatewayEnum } from "../enums";
import { BillingAdressType } from "../interfaces";
import { autoIncrement } from 'mongoose-plugin-autoinc';

interface IRating extends Document {
    offer_id: string;
    customer_id: string;
    rating: number;
    rating_comment: string;
    status: number;
    created_by: number;
}

const ratingSchema: Schema = new Schema({

    offer_id: { type: Schema.Types.ObjectId, ref: 'offers' },
    customer_id: { type: Schema.Types.ObjectId, ref: 'customers' },
    rating: { type: Number, default: 0 },
    rating_comment: { type: String, default: 0 },
    status: { type: Number, default: 1 },
    created_by: { type: Schema.Types.ObjectId, ref: 'customers' },
    updated_by: { type: Schema.Types.ObjectId, ref: 'customers' }
},
    {
        timestamps: true,
        versionKey: false
    });

    ratingSchema.plugin(autoIncrement, { model: 'ratings', field: 'id', startAt: 1 });

const Rating = model<IRating>('ratings', ratingSchema);

export default Rating;