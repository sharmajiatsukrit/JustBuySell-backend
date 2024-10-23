import { Document, Schema, model } from 'mongoose';
import { BillingGatewayEnum } from "../enums";
import { BillingAdressType } from "../interfaces";
import { autoIncrement } from 'mongoose-plugin-autoinc';

interface IUnlockOffers extends Document {
    offer_id: string;
    transaction_id: string;
    price: number;
    status: number;
    created_by: number;
}

const unlockoffersSchema: Schema = new Schema({

    offer_id: { type: Schema.Types.ObjectId, ref: 'offers' },
    transaction_id: { type: Schema.Types.ObjectId, ref: 'transactions' },
    price: { type: Number, default: '' },
    status: { type: Number, default: 1 },
    created_by: { type: Schema.Types.ObjectId, ref: 'customers' },
    updated_by: { type: Schema.Types.ObjectId, ref: 'customers' }
},
    {
        timestamps: true,
        versionKey: false
    });

unlockoffersSchema.plugin(autoIncrement, { model: 'unlocked_offers', field: 'id', startAt: 1 });

const UnlockOffers = model<IUnlockOffers>('unlocked_offers', unlockoffersSchema);

export default UnlockOffers;