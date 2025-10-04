import { Document, Schema, model } from "mongoose";
import { autoIncrement } from "mongoose-plugin-autoinc";
const mongooseFieldEncryption = require("mongoose-field-encryption").fieldEncryption;

interface ICustomer extends Document {
    name: string;
    phone: string;
    email: string;
    admin_commission: string;
    trade_name: string;
    leagal_name: string;
    company_logo: string;
    designation: string;
    gst: string;
    is_gst_verified: boolean;
    telephone: string;
    company_email: string;
    address_line_1: string;
    landmark: string;
    city: string;
    state: string;
    pincode: string;
    open_time: string;
    close_time: string;
    parent_id: string;
    latitude: string;
    longitude: string;
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
    admin_commission: { type: String, default: '' },
    trade_name: { type: String, default: '' },
    designation: { type: String, default: '' },
    leagal_name: { type: String, default: '' },
    company_logo: { type: String, default: '' },
    gst: { type: String, default: '' },
    is_gst_verified: { type: Boolean, default: false },
    telephone: { type: String, default: '' },
    whatapp_num: { type: String, default: '' },
    company_email: { type: String, default: '' },
    address_line_1: { type: String, default: '' },
    landmark: { type: String, default: '' },
    city: { type: String, default: '' },
    state: { type: String, default: '' },
    pincode: { type: String, default: '' },
    open_time: { type: String, default: '' },
    close_time: { type: String, default: '' },
    parent_id: { type: Schema.Types.ObjectId, ref: 'customers', default: null },
    latitude: { type: String, default: '' },
    longitude: { type: String, default: '' },
    is_email_verified: { type: Boolean, default: false },
    is_user_new: { type: Boolean, default: true },
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