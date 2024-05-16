import { Document, Schema, model } from 'mongoose';
import { autoIncrement } from 'mongoose-plugin-autoinc';

interface IUnit extends Document {
    name: string;
    shortname: string;
    status: boolean;
    created_by: number;
    updated_by: number;
}

const unitSchema: Schema = new Schema({
    
    name: { type: String, default: '' },
    shortname: { type: String, default: '' },
    status: { type: Boolean, default: true },
    created_by: { type: Number, default: 0 },
    updated_by: { type: Number, default: 0 }
},
{
    timestamps: true,
    versionKey: false
});

unitSchema.plugin(autoIncrement, { model: 'units', field: 'id', startAt: 1 });

const Unit = model<IUnit>('units', unitSchema);

export default Unit;