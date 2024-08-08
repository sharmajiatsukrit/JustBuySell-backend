import { Document, Schema, model } from 'mongoose';
import { autoIncrement } from 'mongoose-plugin-autoinc';
import { User } from ".";
import { UserPermssionType } from "../enums/user";

interface IPermissons extends Document {
    name: string;
    description: string;
    status: boolean;
    created_by: number;
    updated_by: number
}

const permissionSchema: Schema = new Schema({
    name: { type: String, default: '' },
    description: { type: String, default: '' },
    status: { type: Boolean, default: true },
    created_by: { type: Schema.Types.ObjectId, ref: 'users' },
    updated_by: { type: Schema.Types.ObjectId, ref: 'users' }
},
    {
        timestamps: true,
        versionKey: false
    });
permissionSchema.index({ user_id: 1, invite_type: 1 });
permissionSchema.index({ subscriber_id: 1, user_id: 1 });
permissionSchema.plugin(autoIncrement, { model: 'permissions', field: 'id', startAt: 1 });

const Permissons = model<IPermissons>('permissions', permissionSchema);

export default Permissons;