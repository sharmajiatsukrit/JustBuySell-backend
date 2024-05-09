import { Document, Schema, model } from 'mongoose';
import { BillingGatewayEnum } from "../enums";
import { BillingAdressType } from "../interfaces";
import { autoIncrement } from 'mongoose-plugin-autoinc';

interface ICategory extends Document {
    name: string;
    description: string;
    parent_id: number;
    status: boolean;
    created_by: number;
    updated_by: number;
}

const categorySchema: Schema = new Schema({
    
    name: { type: String, default: '' },
    description: { type: String, default: '' },
    parent_id: { type: Number, default: 0 },
    status: { type: Boolean, default: true },
    created_by: { type: Number, default: 0 },
    updated_by: { type: Number, default: 0 }
},
{
    timestamps: true,
    versionKey: false
});

categorySchema.plugin(autoIncrement, { model: 'category', field: 'id', startAt: 1 });

const Category = model<ICategory>('category', categorySchema);

export default Category;