import { Document, Schema, model } from 'mongoose';
import { BillingGatewayEnum } from "../enums";
import { BillingAdressType } from "../interfaces";
import { autoIncrement } from 'mongoose-plugin-autoinc';

interface IRoles extends Document {
    name: string;
    description: string;
    permissions: [];
    status: boolean;
    created_by: number;
    updated_by: number;
}

const rolesSchema: Schema = new Schema({

    name: { type: String, default: '' },
    description: { type: String, default: '' },
    permissions: { type: Array, default: [] },
    status: { type: Boolean, default: true },
    created_by: { type: Schema.Types.ObjectId, ref: 'users' },
    updated_by: { type: Schema.Types.ObjectId, ref: 'users' }
},
    {
        timestamps: true,
        versionKey: false
    });

rolesSchema.plugin(autoIncrement, { model: 'roles', field: 'id', startAt: 1 });

const Roles = model<IRoles>('roles', rolesSchema);

export default Roles;