import { Document, Schema, model } from "mongoose";
import { autoIncrement } from "mongoose-plugin-autoinc";
const mongooseFieldEncryption = require("mongoose-field-encryption").fieldEncryption;

interface ICustomer extends Document {
    email: string;
    is_email_verified: boolean;
    communication_email: string;
    name: string;
    profile_img_url: string;
    password: string;
    mobile_number_country_code: string;
    mobile_number: string;
    is_mobile_number_verified: boolean;
    date_of_birth: string;
    country_code: string;
    country: number;
    state: number;
    city: number;
    address: string;
    language_code: string;
    language: string;
    gst_no: string;
    is_gst_verified: boolean;
    ip_address: string;
    device: string;
    role_id: number;
    status: number;
    type: number;
    pincode: number;
    telephonenumber: number;
}

const customerSchema: Schema = new Schema({
    email: { type: String },
    is_email_verified: { type: Boolean, default: false },
    communication_email: { type: String, default: '' },
    name: { type: String, default: '' },
    profile_img_url: { type: String, default: '' },
    password: { type: String, default: '' },
    mobile_number_country_code: { type: String, default: '' },
    mobile_number: { type: String, default: '', required: true, index: { unique: true }},
    is_mobile_number_verified: { type: Boolean, default: false },
    date_of_birth: { type: String, default: '' },
    country_code: { type: String, default: '' },
    country: { type: Number, default: '' },
    state: { type: Number, default: '' },
    city: { type: Number, default: '' },
    address: { type: String, default: '' },
    language_code: { type: String, default: 'en' },
    language: { type: String, default: 'English' },
    gst_no: { type: String, default: '' },
    is_gst_verified: { type: Boolean, default: false },
    device: { type: String, default: 'Android'},
    ip_address: { type: String, default: '' },
    role_id: { type: Number, default: '' },
    status: { type: Number, default: false },
    type: {type: Number, default: ''},
    pincode: { type: Number, default: '' },
    telephonenumber: { type: Number, default: '' }
},
{
    timestamps: true,
    versionKey: false
});

customerSchema.plugin(autoIncrement, { model: 'customer', field: 'id', startAt: 1 });

customerSchema.plugin(mongooseFieldEncryption, {
    fields: [], 
    secret: process.env.JWT_SECRET,
    saltGenerator: () => { return process.env.JWT_SECRET?.slice(0, 16) }
  });

const Customer = model<ICustomer>('customer', customerSchema);

export default Customer;