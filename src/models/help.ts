import { Document, Schema, model } from 'mongoose';
import { BillingGatewayEnum } from "../enums";
import { BillingAdressType } from "../interfaces";
import { autoIncrement } from 'mongoose-plugin-autoinc';

interface Help extends Document {
    email: string;
    phone: number;
    address: string;
}

const helpSchema: Schema = new Schema({
    
    email: { type: String, default: '' },
    phone: { type: String, default: '' },
    address: { type: String, default: ' ' },
},
{
    timestamps: true,
    versionKey: false
});

helpSchema.plugin(autoIncrement, { model: 'help', field: 'id', startAt: 1 });

const Help = model<Help>('help', helpSchema);

export default Help;