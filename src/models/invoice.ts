import { Document, Schema, model } from 'mongoose';
import { BillingGatewayEnum } from "../enums";
import { BillingAdressType } from "../interfaces";
import { autoIncrement } from 'mongoose-plugin-autoinc';

interface IInvoice extends Document {
    sub_total_amount: string;
    total_amount: string;
    gst: string;
    invoice: string;
    file: string;
    start_date: string;
    end_date: string;
    status: boolean;
    created_by: number;
    updated_by: number;
}

const InvoiceSchema: Schema = new Schema({
    sub_total_amount: { type: String, default: '', required: true },
    total_amount: { type: String, default: '', required: true },
    total_discount: { type: String, default: '', required: true },
    gst: { type: String, default: '' },
    igst: { type: String, default: '' },
    cgst: { type: String, default: '' },
    sgst: { type: String, default: '' },
    invoice_id: { type: String, default: '' },
    invoice_number: { type: String, default: '' },
    start_date: { type: String, default: '' },
    end_date: { type: String, default: '' },
    month: { type: String, default: '' },
    year: { type: String, default: '' },
    file: { type: String, default: '' },
    status: { type: Boolean, default: true },
    customer_id: { type: Schema.Types.ObjectId, ref: 'customers' },
    created_by: { type: Schema.Types.ObjectId, ref: 'users' },
    updated_by: { type: Schema.Types.ObjectId, ref: 'users' }
}, {
    timestamps: true,
    versionKey: false
});

InvoiceSchema.plugin(autoIncrement, { model: 'invoices', field: 'id', startAt: 1 });

const Invoice = model<IInvoice>('invoices', InvoiceSchema);

export default Invoice;