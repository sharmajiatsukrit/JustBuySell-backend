import { Document, Schema, model } from 'mongoose';
import { autoIncrement } from 'mongoose-plugin-autoinc';

interface IAttribute extends Document {
    name: string;
    status: boolean;
    created_by: number;
    updated_by: number;
}

const attributeSchema: Schema = new Schema({

    name: { type: String, default: '' },
    status: { type: Boolean, default: true },
    created_by: { type: Schema.Types.ObjectId, ref: 'users' },
    updated_by: { type: Schema.Types.ObjectId, ref: 'users' }
},
    {
        timestamps: true,
        versionKey: false
    });

attributeSchema.plugin(autoIncrement, { model: 'attributes', field: 'id', startAt: 1 });

const Attribute = model<IAttribute>('attributes', attributeSchema);

export default Attribute;