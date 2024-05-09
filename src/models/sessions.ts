import { Document, Schema, model } from 'mongoose';
import { autoIncrement } from 'mongoose-plugin-autoinc';
import { User } from ".";

interface ISessions extends Document {
    user_id: number;
    token: string;
    status: boolean;
    expires_in: Date;
    last_used: Date;
    ip: string;
    ip_info: any;
    device_type: string;
    device_os: string;
    device_info: any;
    city: string;
    region: string;
    country: string;
    latitude: number;
    longitude: number;
}

const sessionsSchema: Schema = new Schema({
    user_id: { type: Number, ref: 'users' },
    token: { type: String, default: '' },
    status: { type: Boolean, default: true },
    expires_in: { type: Date },
    last_used: { type: Date },
    ip: { type: String, default: '' },
    ip_info: { type: Object, default: {} },
    device_type: { type: String, default: '' },
    device_os: { type: String, default: '' },
    device_info: { type: Object, default: {} },
    city: { type: String, default: '' },
    region: { type: String, default: '' },
    country: { type: String, default: '' },
    latitude: { type: Schema.Types.Decimal128, default: 0 },
    longitude: { type: Schema.Types.Decimal128, default: 0 }
},
{
    timestamps: true,
    versionKey: false
});

sessionsSchema.plugin(autoIncrement, { model: 'sessions', field: 'id', startAt: 1 });

const Sessions = model<ISessions>('sessions', sessionsSchema);

export default Sessions;