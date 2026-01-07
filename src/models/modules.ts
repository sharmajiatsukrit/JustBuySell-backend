import { Document, Schema, model } from 'mongoose';
import { autoIncrement } from 'mongoose-plugin-autoinc';

interface IModules extends Document {
    name: string;
    status: boolean;
    created_by: number;
    updated_by: number;
}

const ModulesSchema: Schema = new Schema({
    name: { type: String, default: '' },
    status: { type: Boolean, default: true },
    created_by: { type: Schema.Types.ObjectId, ref: 'users' },
    updated_by: { type: Schema.Types.ObjectId, ref: 'users' }
},
    {
        timestamps: true,
        versionKey: false
    });

ModulesSchema.plugin(autoIncrement, { model: 'modules', field: 'id', startAt: 1 });

const Modules = model<IModules>('modules', ModulesSchema);

export default Modules;