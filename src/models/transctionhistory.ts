import { Document, Schema, model } from 'mongoose';
import { BillingGatewayEnum } from "../enums";
import { BillingAdressType } from "../interfaces";
import { autoIncrement } from 'mongoose-plugin-autoinc';

interface ITransctionhistory extends Document {
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

TransactionSchema.plugin(autoIncrement, { model: 'transctionhistory', field: 'id', startAt: 1 });

const TransctionHistory = model<ITransctionhistory>('transctionhistory', TransactionSchema);

export default TransctionHistory;