import { Document, Schema, model } from 'mongoose';
import { BillingGatewayEnum } from "../enums";
import { BillingAdressType } from "../interfaces";
import { autoIncrement } from 'mongoose-plugin-autoinc';

interface IProducts extends Document {
    name: string;
    description: string;
    price: string;
    category_id: number;
    unit_id: number;
    unit: string;
    product_image: string;
    status: boolean;
    created_by: number;
    updated_by: number;
}

const productsSchema: Schema = new Schema({
    
    name: { type: String, default: '' },
    description: { type: String, default: '' },
    price: { type: Number, default: '' },
    category_id: { type: Number, default: 0 },
    unit_id: { type: Number, default: '' },
    pack: { type: String, default: '' },
    product_image: { type: String, default: '' },
    status: { type: Boolean, default: true },
    created_by: { type: Number, default: 0 },
    updated_by: { type: Number, default: 0 }
},
{
    timestamps: true,
    versionKey: false
});

productsSchema.plugin(autoIncrement, { model: 'products', field: 'id', startAt: 1 });

const Products = model<IProducts>('products', productsSchema);

export default Products;