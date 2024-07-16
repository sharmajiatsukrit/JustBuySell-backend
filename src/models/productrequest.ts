import { Document, Schema, model } from 'mongoose';
import { BillingGatewayEnum } from "../enums";
import { BillingAdressType } from "../interfaces";
import { autoIncrement } from 'mongoose-plugin-autoinc';
import Unit from './unit';

interface IProductRequest extends Document {
    name: string;
    sellingunit:string;
    indivisualpacksize:string;
    indivisualpackunit:string;
    indivisualpacktype:string;
    unitid: number;
    pack: string;
    masterpackqty: string;
    masterpacktype: string;
    description: string;
    status: number;
    productImg: string;
    created_by: number;
    updated_by: number;
}

const productRequestSchema: Schema = new Schema({
    
    name: { type: String, default: '' },
    unitid: { type: Number, default: '' },
    sellingunit: { type: String, default: '' },
    indivisualpacksize: { type: String, default: '' },
    indivisualpackunit: { type: String, default: '' },
    indivisualpacktype: { type: String, default: '' },
    pack: { type: String, default: '' },
    masterpackqty: { type: String, default: 0 },
    masterpacktype: { type: String, default: 0 },
    description: { type: String, default: 0 },
    status: { type: Number, default: 0 },
    created_by: { type: Number, default: 0 },
    updated_by: { type: Number, default: 0 },
    productImg: { type: String, default: '',required: true },
},
{
    timestamps: true,
    versionKey: false
});


productRequestSchema.plugin(autoIncrement, { model: 'productrequest', field: 'id', startAt: 1 });

const ProductRequest = model<IProductRequest>('productrequest', productRequestSchema);

export default ProductRequest;

