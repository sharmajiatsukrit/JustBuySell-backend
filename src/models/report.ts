import { Document, Schema, model } from 'mongoose';
import { BillingAdressType } from "../interfaces";
import { autoIncrement } from 'mongoose-plugin-autoinc';

interface IReport extends Document {
    message: string;
    created_by: number;
    updated_by: number;
    createdAt: Date;
    updatedAt: Date;
}

const ReportSchema: Schema = new Schema({
    message: { type: String, default: '' },
    created_by: { type: Number, default: 0 },
    updated_by: { type: Number, default: 0 }
},
{
    timestamps: true,
    versionKey: false
});

ReportSchema.plugin(autoIncrement, { model: 'report', field: 'id', startAt: 1 });

const Report = model<IReport>('report', ReportSchema);

export default Report;