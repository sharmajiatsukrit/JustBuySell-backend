import { Document, Schema, model } from 'mongoose';
import { BillingGatewayEnum } from "../enums";
import { BillingAdressType } from "../interfaces";
import { autoIncrement } from 'mongoose-plugin-autoinc';

interface ITransaction extends Document {
    amount: number;
    gst: number;
    transaction_type: number;
    transaction_id: string;
    razorpay_order_id: number;
    razorpay_order_amount: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
    status: number;
    remarks: string;
    customer_id: number;
}

const TransactionSchema: Schema = new Schema({

    amount: { type: Number, default: 0 },
    gst: { type: Number, default: 0 },
    transaction_type: { type: Number, default: '' },
    transaction_id: { type: String, default: '' },
    razorpay_order_id: { type: String, default: '' },
    razorpay_order_amount: { type: String, default: '' },
    razorpay_payment_id:{ type: String, default: '' },
    razorpay_signature:{ type: String, default: '' },
    status: { type: Number, default: 0 },
    error_code: { type: Number, default: null },
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