import { Document, Schema, model } from "mongoose";
import { autoIncrement } from "mongoose-plugin-autoinc";
const mongooseFieldEncryption = require("mongoose-field-encryption").fieldEncryption;

interface IUser extends Document {
    name: string;
    phone: string;
    email: string;
    profile_img: string;
    password: string;
    date_of_birth: string;
    country_id: number;
    state_id: number;
    city_id: number;
    address: string;
    language_code: string;
    language: string;
    ip_address: string;
    device: string;
    role_id: number;
    status: number;
    created_by: number;
    updated_by: number;
}

const userSchema: Schema = new Schema({
    name: { type: String, default: '' },
    phone: { type: String, default: '' },
    email: { type: String, required: true, index: { unique: true } },
    profile_img: { type: String, default: '' },
    password: { type: String, default: '' },
    date_of_birth: { type: String, default: '' },
    country_id: { type: Schema.Types.ObjectId, ref: 'countries' },
    state_id: { type: Schema.Types.ObjectId, ref: 'states' },
    city_id: { type: Schema.Types.ObjectId, ref: 'cities' },
    address: { type: String, default: '' },
    language_code: { type: String, default: 'en' },
    language: { type: String, default: 'English' },
    ip_address: { type: String, default: '' },
    device: { type: String, default: 'Android' },
    role_id: { type: Schema.Types.ObjectId, ref: 'roles' },
    status: { type: Number, default: 1 },
    created_by: { type: Schema.Types.ObjectId, ref: 'users' },
    updated_by: { type: Schema.Types.ObjectId, ref: 'users' }
},
    {
        timestamps: true,
        versionKey: false
    });

userSchema.plugin(autoIncrement, { model: 'users', field: 'id', startAt: 1 });

userSchema.plugin(mongooseFieldEncryption, {
    fields: [],
    secret: process.env.JWT_SECRET,
    saltGenerator: () => { return process.env.JWT_SECRET?.slice(0, 16) }
});

const User = model<IUser>('users', userSchema);

export default User;