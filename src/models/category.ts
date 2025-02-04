import { Document, Schema, model } from 'mongoose';
import { BillingGatewayEnum } from "../enums";
import { BillingAdressType } from "../interfaces";
import { autoIncrement } from 'mongoose-plugin-autoinc';

interface ICategory extends Document {
    name: string;
    description: string;
    parent_id: string;
    status: boolean;
    cat_img: string;
    created_by: number;
    updated_by: number;
}

const categorySchema: Schema = new Schema({
    name: { type: String, default: '' },
    description: { type: String, default: '' },
    parent_id: { type: Schema.Types.ObjectId, ref: 'categories',default: null },
    status: { type: Boolean, default: true },
    cat_img: { type: String, default: '' },
    created_by: { type: Schema.Types.ObjectId, ref: 'users' },
    updated_by: { type: Schema.Types.ObjectId, ref: 'users' }
},
    {
        timestamps: true,
        versionKey: false
    });

categorySchema.plugin(autoIncrement, { model: 'categories', field: 'id', startAt: 1 });

const Category = model<ICategory>('categories', categorySchema);

export default Category;