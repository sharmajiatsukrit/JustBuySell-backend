import { Document, Schema, model } from 'mongoose';
import { BillingGatewayEnum } from "../enums";
import { BillingAdressType } from "../interfaces";
import { autoIncrement } from 'mongoose-plugin-autoinc';
import Unit from './unit';

interface IProductRequest extends Document {
    name: string;
    selling_unit: string;
    individual_pack_size: string;
    individual_pack_unit: string;
    Individual_packing_type: string;
    master_pack_qty: string;
    product_image: string;
    master_pack_type: string;
    description: string;
    status: number;
    created_by: number;
    updated_by: number;
}

const productRequestSchema: Schema = new Schema({

    name: { type: String, default: '' },
    selling_unit: { type: String, default: '' },
    individual_pack_size: { type: String, default: '' },
    individual_pack_unit: { type: String, default: 0 },
    Individual_packing_type: { type: String, default: 0 },
    master_pack_qty: { type: String, default: 0 },
    product_image: { type: String, default: '' },
    master_pack_type: { type: String, default: 0 },
    description: { type: String, default: 0 },
    status: { type: Number, default: 0 },
    created_by: { type: Schema.Types.ObjectId, ref: 'customers' },
    updated_by: { type: Schema.Types.ObjectId, ref: 'users' },

},
    {
        timestamps: true,
        versionKey: false
    });


productRequestSchema.plugin(autoIncrement, { model: 'product_requests', field: 'id', startAt: 1 });

const ProductRequest = model<IProductRequest>('product_requests', productRequestSchema);

export default ProductRequest;

