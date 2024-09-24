import { Document, Schema, model } from 'mongoose';
import { BillingGatewayEnum } from "../enums";
import { BillingAdressType } from "../interfaces";
import { autoIncrement } from 'mongoose-plugin-autoinc';

interface IBanner extends Document {
    name: string;
    banner: string;
    external_url: string;
    start_date: string;
    end_date: string;
    status: boolean;
    created_by: number;
    updated_by: number;
}

const BannerSchema: Schema = new Schema({
    name: { type: String, default: '', required: true },
    banner: { type: String, default: '' },
    start_date: { type: String, default: '' },
    end_date: { type: String, default: '' },
    external_url: { type: String, default: '' },
    status: { type: Boolean, default: true },
    created_by: { type: Schema.Types.ObjectId, ref: 'users' },
    updated_by: { type: Schema.Types.ObjectId, ref: 'users' }
}, {
    timestamps: true,
    versionKey: false
});

BannerSchema.plugin(autoIncrement, { model: 'banners', field: 'id', startAt: 1 });

const Banner = model<IBanner>('banners', BannerSchema);

export default Banner;