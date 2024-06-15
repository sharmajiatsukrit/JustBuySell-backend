import { Document, Schema, model } from 'mongoose';
import { BillingGatewayEnum } from "../enums";
import { BillingAdressType } from "../interfaces";
import { autoIncrement } from 'mongoose-plugin-autoinc';

interface IWallet extends Document {
    wallet: string;
    userid: string;
    status: boolean;
    created_by: number;
    updated_by: number;
}

const walletSchema: Schema = new Schema({
    
    wallet: { type: String, default: '' },
    userid: { type: String, default: '' },
    status: { type: Boolean, default: true },
    created_by: { type: Number, default: 0 },
    updated_by: { type: Number, default: 0 }
},
{
    timestamps: true,
    versionKey: false
});

walletSchema.plugin(autoIncrement, { model: 'wallet', field: 'id', startAt: 1 });

const Wallet = model<IWallet>('wallet', walletSchema);

export default Wallet;