import { Document, Schema, model } from 'mongoose';
import { BillingGatewayEnum } from "../enums";
import { BillingAdressType } from "../interfaces";
import { autoIncrement } from 'mongoose-plugin-autoinc';

interface ITransaction extends Document {
    amount: string;
    userid: string;
    trnid: string;
    type: number;
    status: boolean;
    created_by: number;
    updated_by: number;
}

const TransactionSchema: Schema = new Schema({

    amount: { type: String, default: '' },
    userid: { type: String, default: '' },
    trnid: { type: String, default: '' },
    type: { type: Number, default: '' },
    status: { type: Boolean, default: true },
    created_by: { type: Schema.Types.ObjectId, ref: 'users' },
    updated_by: { type: Schema.Types.ObjectId, ref: 'users' }
},
    {
        timestamps: true,
        versionKey: false
    });

TransactionSchema.plugin(autoIncrement, { model: 'transactions', field: 'id', startAt: 1 });

const Transaction = model<ITransaction>('transactions', TransactionSchema);

export default Transaction;