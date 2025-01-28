import { Document, Schema, model } from 'mongoose';
import { BillingAdressType } from "../interfaces";
import { autoIncrement } from 'mongoose-plugin-autoinc';

interface IReport extends Document {
    message: string;
    created_by: number;
    updated_by: number;
}

const ReportSchema: Schema = new Schema({
    message: { type: String, default: '' },
    created_by: { type: Schema.Types.ObjectId, ref: 'customers' },
    updated_by: { type: Schema.Types.ObjectId, ref: 'users' }
},
    {
        timestamps: true,
        versionKey: false
    });

ReportSchema.plugin(autoIncrement, { model: 'report_issues', field: 'id', startAt: 1 });

const ReportIssues = model<IReport>('report_issues', ReportSchema);

export default ReportIssues;