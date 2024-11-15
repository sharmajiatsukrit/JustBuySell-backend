import { Document, Schema, model } from 'mongoose';
import { BillingGatewayEnum } from "../enums";
import { BillingAdressType } from "../interfaces";
import { autoIncrement } from 'mongoose-plugin-autoinc';

interface IProducts extends Document {
    name: string;
    description: string;
    category_id: string[];
    attributes: string; // Dynamic attributes stored as key-value pairs
    product_image: string;
    selling_unit: string;
    individual_pack_size: string;
    individual_pack_unit: string;
    individual_packing_type: string;
    master_pack_qty: number;
    master_pack_type: string;
    conversion_unit: string;
    status: boolean;
    created_by: number;
    updated_by: number;
}

const productsSchema: Schema = new Schema({

    name: { type: String, default: '' },
    description: { type: String, default: '' },
    attributes: { type: Map, of: Array, default: {} }, // Dynamic attributes
    category_id: [{ type: Schema.Types.ObjectId, ref: 'categories' }],
    product_image: { type: String, default: '' },
    selling_unit: { type: Schema.Types.ObjectId, ref: 'attribute_items' },
    individual_pack_size: { type: Schema.Types.ObjectId, ref: 'attribute_items' },
    individual_pack_unit: { type: Schema.Types.ObjectId, ref: 'attribute_items' },
    individual_packing_type: { type: Schema.Types.ObjectId, ref: 'attribute_items' },
    master_pack_qty: { type: Number, default: 0 },
    master_pack_type: { type: Schema.Types.ObjectId, ref: 'attribute_items' },
    conversion_unit: { type: Schema.Types.ObjectId, ref: 'attribute_items' },
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