import { Document, Schema, model } from 'mongoose';
import { autoIncrement } from 'mongoose-plugin-autoinc';

interface IAttributeItem extends Document {
    name: string;
    attribute_id: string;
    status: boolean;
    created_by: number;
    updated_by: number;
}

const attributeitemSchema: Schema = new Schema({

    name: { type: String, default: '' },
    status: { type: Boolean, default: true },
    attribute_id: { type: Schema.Types.ObjectId, ref: 'attributes' },
    created_by: { type: Schema.Types.ObjectId, ref: 'users' },
    updated_by: { type: Schema.Types.ObjectId, ref: 'users' }
},
    {
        timestamps: true,
        versionKey: false
    });

attributeitemSchema.plugin(autoIncrement, { model: 'attribute_items', field: 'id', startAt: 1 });

const AttributeItem = model<IAttributeItem>('attribute_items', attributeitemSchema);

export default AttributeItem;