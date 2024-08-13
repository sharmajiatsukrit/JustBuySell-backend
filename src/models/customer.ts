import { Document, Schema, model } from "mongoose";
import { autoIncrement } from "mongoose-plugin-autoinc";
const mongooseFieldEncryption = require("mongoose-field-encryption").fieldEncryption;

interface ICustomer extends Document {
    name: string;
    phone: string;
    email: string;
    company_name: string;
    brand_name: string;
    company_logo: string;
    gst: string;
    telephone: string;
    company_email: string;
    address_line_1: string;
    address_line_2: string;
    open_time: string;
    close_time: string;
    parent_id: string;
    is_email_verified: boolean;
    language_code: string;
    language: string;
    device: string;
    status: number;
}

const customerSchema: Schema = new Schema({
    name: { type: String, default: '' },
    phone: { type: String, required: true, index: { unique: true } },
    email: { type: String },
    company_name: { type: String, default: '' },
    brand_name: { type: String, default: '' },
    company_logo: { type: String, default: '' },
    gst: { type: String, default: '' },
    telephone: { type: String, default: '' },
    company_email: { type: String, default: '' },
    address_line_1: { type: String, default: '' },
    address_line_2: { type: String, default: '' },
    open_time: { type: String, default: '' },
    close_time: { type: String, default: '' },
    parent_id: { type: String, default: 0 },
    is_email_verified: { type: Boolean, default: false },
    language_code: { type: String, default: 'en' },
    language: { type: String, default: 'English' },
    device: { type: String, default: 'Android' },
    status: { type: Number, default: 0 }
},
    {
        timestamps: true,
        versionKey: false
    });

customerSchema.plugin(autoIncrement, { model: 'customers', field: 'id', startAt: 1 });

customerSchema.plugin(mongooseFieldEncryption, {
    fields: [],
    secret: process.env.JWT_SECRET,
    saltGenerator: () => { return process.env.JWT_SECRET?.slice(0, 16) }
});

const Customer = model<ICustomer>('customers', customerSchema);

export default Customer;