import { Document, Schema, model } from 'mongoose';
import { BillingAdressType } from "../interfaces";
import { autoIncrement } from 'mongoose-plugin-autoinc';

interface IFaqs extends Document {
    question: string;
    answer: string;
    status: boolean;
    created_by: number;
    updated_by: number;
}

const FaqsSchema: Schema = new Schema({
    question: { type: String, default: '' },
    answer: { type: String, default: '' },
    status: { type: Boolean, default: '' },
    created_by: { type: Schema.Types.ObjectId, ref: 'users' },
    updated_by: { type: Schema.Types.ObjectId, ref: 'users' }
},
    {
        timestamps: true,
        versionKey: false
    });

FaqsSchema.plugin(autoIncrement, { model: 'faqs', field: 'id', startAt: 1 });

const Faqs = model<IFaqs>('faqs', FaqsSchema);

export default Faqs;