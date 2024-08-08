import { Document, Schema, model } from 'mongoose';
import { BillingGatewayEnum } from "../enums";
import { BillingAdressType } from "../interfaces";
import { autoIncrement } from 'mongoose-plugin-autoinc';

interface Iproductwatch extends Document {
    watchlistid: number;
    productid: number;
    status: boolean;
    created_by: number;
    updated_by: number;
}

const ProductwatchSchema: Schema = new Schema({

    watchlistid: { type: Number, default: '' },
    productid: { type: Number, default: '' },
    status: { type: Boolean, default: true },
    created_by: { type: Schema.Types.ObjectId, ref: 'users' },
    updated_by: { type: Schema.Types.ObjectId, ref: 'users' }
},
    {
        timestamps: true,
        versionKey: false
    });

ProductwatchSchema.plugin(autoIncrement, { model: 'productwatch', field: 'id', startAt: 1 });

const Productwatch = model<Iproductwatch>('productwatch', ProductwatchSchema);

export default Productwatch;