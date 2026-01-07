import { Document, Schema, model } from 'mongoose';
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
    igst: { type: Number, default: 0 },
    sgst: { type: Number, default: 0 },
    cgst: { type: Number, default: 0 },
    discount: { type: Number, default: 0 },
    commission:{type: Number, default: 0},
    offer_price: { type: Number, default: 0 },
    closing_balance: { type: Number, default: 0 },
    particular: { type: String, default: "" },
    category_id: { type: String, default: "" },
    product_id: { type: String, default: "" },
    lead_id: { type: String, default: "" },
    transaction_type: { type: Number, default: 0 },
    transaction_id: { type: String, default: '' },
    razorpay_order_id: { type: String, default: '' },
    razorpay_order_amount: { type: String, default: '' },
    razorpay_payment_id:{ type: String, default: '' },
    razorpay_signature:{ type: String, default: '' },
    remaining_balance:{ type: Number, default: 0 },//for promo use tracking

    type: { type: Number, default: 0 },
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