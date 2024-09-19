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
    packs: string;
    master_packs: string;
    trade_units: string;
    offer_units: string;
    product_image: string;
    status: boolean;
    created_by: number;
    updated_by: number;
}

const productsSchema: Schema = new Schema({

    name: { type: String, default: '' },
    description: { type: String, default: '' },
    price: { type: Number, default: '' },
    category_id: { type: Schema.Types.ObjectId, ref: 'categories' },
    unit_id: { type: Schema.Types.ObjectId, ref: 'units' },
    packs: { type: Object, default: [] },
    master_packs: { type: Object, default: [] },
    trade_units: { type: Object, default: [] },
    offer_units: { type: Object, default: [] },
    product_image: { type: String, default: '' },
    status: { type: Boolean, default: true },
    created_by: { type: Schema.Types.ObjectId, ref: 'users' },
    updated_by: { type: Schema.Types.ObjectId, ref: 'users' }
},
    {
        timestamps: true,
        versionKey: false
    });

productsSchema.plugin(autoIncrement, { model: 'products', field: 'id', startAt: 1 });

const Products = model<IProducts>('products', productsSchema);

export default Products;