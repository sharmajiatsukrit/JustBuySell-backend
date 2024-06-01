import { Document, Schema, model } from 'mongoose';
import { BillingGatewayEnum } from "../enums";
import { BillingAdressType } from "../interfaces";
import { autoIncrement } from 'mongoose-plugin-autoinc';

interface IProductRequest extends Document {
    productname: string;
    tradeunit: string;
    pack: string;
    masterpack: string;
    description: string;
    status: number;
    created_by: number;
    updated_by: number;
}

const productRequestSchema: Schema = new Schema({
    
    productname: { type: String, default: '' },
    tradeunit: { type: String, default: '' },
    pack: { type: String, default: '' },
    masterpack: { type: String, default: 0 },
    description: { type: String, default: 0 },
    status: { type: Number, default: 0 },
    created_by: { type: Number, default: 0 },
    updated_by: { type: Number, default: 0 }
},
{
    timestamps: true,
    versionKey: false
});

productRequestSchema.plugin(autoIncrement, { model: 'productrequest', field: 'id', startAt: 1 });

const ProductRequest = model<IProductRequest>('productrequest', productRequestSchema);

export default ProductRequest;