import { Document, Schema, model } from 'mongoose';
import { BillingGatewayEnum } from "../enums";
import { BillingAdressType } from "../interfaces";
import { autoIncrement } from 'mongoose-plugin-autoinc';

interface IWallet extends Document {
    customer_id: string;
    balance: string;
}

const walletSchema: Schema = new Schema({

    balance: { type: String, default: '' },
    customer_id: { type: Schema.Types.ObjectId, ref: 'customers' }
},
    {
        timestamps: true,
        versionKey: false
    });

walletSchema.plugin(autoIncrement, { model: 'wallet', field: 'id', startAt: 1 });

const Wallet = model<IWallet>('wallet', walletSchema);

export default Wallet;