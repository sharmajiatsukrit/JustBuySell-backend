import { Document, Schema, model } from 'mongoose';
import { BillingGatewayEnum } from "../enums";
import { BillingAdressType } from "../interfaces";
import { autoIncrement } from 'mongoose-plugin-autoinc';

interface IWatchlist extends Document {
    product_id: number;
    watchlist_id: number;
    customer_id: number;
}

const WatchlistSchema: Schema = new Schema({

    product_id: { type: Schema.Types.ObjectId, ref: 'products' },
    watchlist_id: { type: Schema.Types.ObjectId, ref: 'watchlist' },
    customer_id: { type: Schema.Types.ObjectId, ref: 'customers' }
},
    {
        timestamps: true,
        versionKey: false
    });

WatchlistSchema.plugin(autoIncrement, { model: 'watchlist_items', field: 'id', startAt: 1 });

const WatchlistItem = model<IWatchlist>('watchlist_items', WatchlistSchema);

export default WatchlistItem;