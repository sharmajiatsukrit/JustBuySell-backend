import { Document, Schema, model } from 'mongoose';
import { BillingGatewayEnum } from "../enums";
import { BillingAdressType } from "../interfaces";
import { autoIncrement } from 'mongoose-plugin-autoinc';

interface IWatchlist extends Document {
    name: string;
    status: boolean;
    created_by: number;
    updated_by: number;
}

const WatchlistSchema: Schema = new Schema({

    name: { type: String, default: '' },
    status: { type: Boolean, default: true },
    created_by: { type: Schema.Types.ObjectId, ref: 'customers' },
    updated_by: { type: Schema.Types.ObjectId, ref: 'customers' }
},
    {
        timestamps: true,
        versionKey: false
    });

WatchlistSchema.plugin(autoIncrement, { model: 'watchlist', field: 'id', startAt: 1 });

const Watchlist = model<IWatchlist>('watchlist', WatchlistSchema);

export default Watchlist;