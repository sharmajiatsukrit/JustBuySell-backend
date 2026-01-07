import { Document, Schema, model } from "mongoose";
import { autoIncrement } from "mongoose-plugin-autoinc";

interface IPromoTransaction extends Document {
    amount: number;
    remaining_balance: number;
    expiry_date: string;
    status: boolean;
    notify_before_expiry:boolean;
    notify_on_expiry:boolean;
    remarks: string;
    customer_id: number;
}

const PromoTransactionSchema: Schema = new Schema(
    {
        amount: { type: Number, default: 0 },
        remaining_balance: { type: Number, default: 0 }, //for promo use tracking
        expiry_date: { type: String, default: "" },
        status: { type: Boolean, default: true },
        remarks: { type: String, default: "" },
        notify_before_expiry: { type: Boolean, default: false },
        notify_on_expiry: { type: Boolean, default: false },
        customer_id: { type: Schema.Types.ObjectId, ref: "customers" },
    },
    {
        timestamps: true,
        versionKey: false,
    }
);

PromoTransactionSchema.plugin(autoIncrement, { model: "promo-transactions", field: "id", startAt: 1 });

const PromoTransaction = model<IPromoTransaction>("promo-transactions", PromoTransactionSchema);

export default PromoTransaction;
