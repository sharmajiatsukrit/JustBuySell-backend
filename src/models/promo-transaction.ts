import { Document, Schema, model } from 'mongoose';
import { autoIncrement } from 'mongoose-plugin-autoinc';

interface IPromoTransaction extends Document {
    amount: number;
    expiry_date:string;
    status: boolean;
    remarks: string;
    customer_id: number;
}


const PromoTransactionSchema: Schema = new Schema({
    amount: { type: Number, default: 0 },
    expiry_date: { type: String, default: '' },
    status: { type: Boolean, default: true },
    remarks: { type: String, default: '' },
    customer_id: { type: Schema.Types.ObjectId, ref: 'customers' }
},
    {
        timestamps: true,
        versionKey: false
    });

PromoTransactionSchema.plugin(autoIncrement, { model: 'promo-transactions', field: 'id', startAt: 1 });

const PromoTransaction = model<IPromoTransaction>('promo-transactions', PromoTransactionSchema);

export default PromoTransaction;