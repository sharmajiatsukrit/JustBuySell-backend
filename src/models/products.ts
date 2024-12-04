import { Document, Schema, model } from 'mongoose';
import { BillingGatewayEnum } from "../enums";
import { BillingAdressType } from "../interfaces";
import { autoIncrement } from 'mongoose-plugin-autoinc';

interface IProducts extends Document {
    name: string;
    description: string;
    search_tags: string;
    category_id: string[];
    attributes: Map<string, any[]>; // Dynamic attributes stored as key-value pairs
    variations: Map<string, any[]>; // Dynamic attributes stored as key-value pairs
    product_image: string;
    conversion_unit: string;
    status: boolean;
    created_by: number;
    updated_by: number;
}

const productsSchema: Schema = new Schema({

    name: { type: String, default: '' },
    description: { type: String, default: '' },
    search_tags: { type: String, default: '' },
    attributes: { type: Map, of: Array, default: {} }, // Dynamic attributes
    variations: { type: [Object], default: [] }, // Allow an array of objects // Dynamic attributes
    category_id: [{ type: Schema.Types.ObjectId, ref: 'categories' }],
    product_image: { type: String, default: '' },
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