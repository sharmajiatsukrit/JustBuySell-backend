import { Document, Schema, model } from 'mongoose';
import { BillingGatewayEnum } from "../enums";
import { BillingAdressType } from "../interfaces";
import { autoIncrement } from 'mongoose-plugin-autoinc';

interface ITransaction extends Document {
    amount: number;
    transaction_type: number;
    transaction_id: string;
    order_id: number;
    status: string;
    remarks: string;
    customer_id: number;
}

const TransactionSchema: Schema = new Schema({

    amount: { type: Number, default: 0 },
    transaction_type: { type: Number, default: '' },
    transaction_id: { type: String, default: '' },
    order_id: { type: String, default: '' },
    status: { type: String, default: '' },
    remarks: { type: String, default: '' },
    customer_id: { type: Schema.Types.ObjectId, ref: 'customers' }
},
    {
        timestamps: true,
        versionKey: false
    });

TransactionSchema.plugin(autoIncrement, { model: 'transactions', field: 'id', startAt: 1 });

const Transaction = model<ITransaction>('transactions', TransactionSchema);

export default Transaction;