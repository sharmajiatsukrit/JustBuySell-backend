import { Document, Schema, model } from 'mongoose';
import { autoIncrement } from 'mongoose-plugin-autoinc';

interface IConfigs extends Document {
    key: string;
    data: string;
}

const configSchema: Schema = new Schema({
    key: { type: String },
    data: { type: String }
},
{
    timestamps: true,
    versionKey: false
});

configSchema.plugin(autoIncrement, { model: 'configs', field: 'id', startAt: 1 });

const Configs = model<IConfigs>('configs', configSchema);

export default Configs;