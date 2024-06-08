import { Document, Schema, model } from 'mongoose';
import { BillingGatewayEnum } from "../enums";
import { BillingAdressType } from "../interfaces";
import { autoIncrement } from 'mongoose-plugin-autoinc';

interface IBanner extends Document {
    name: string;
    bannerimg: string;
    status: boolean;
    created_by: number;
    updated_by: number;
}

const BannerSchema: Schema = new Schema({
    
    name: { type: String, default: '' },
    bannerimg: { type: String, default: '' },
    status: { type: Boolean, default: true },
    created_by: { type: Number, default: 0 },
    updated_by: { type: Number, default: 0 }
},
{
    timestamps: true,
    versionKey: false
});

BannerSchema.plugin(autoIncrement, { model: 'banner', field: 'id', startAt: 1 });

const Banner = model<IBanner>('banner', BannerSchema);

export default Banner;