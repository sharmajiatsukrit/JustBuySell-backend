import { Document, Schema, model } from 'mongoose';
import { autoIncrement } from 'mongoose-plugin-autoinc';

interface IProductVariations extends Document {
    product_id: string; // Reference to the main product
    attributes: Record<string, string>; // Dynamic attributes stored as key-value pairs
    category_id: number; // Reference to category
    product_image: string; // URL or path to product image
    status: boolean; // Active status
    created_by: number; // User who created the entry
    updated_by: number; // User who updated the entry
}

const productvariationsSchema: Schema = new Schema({
    product_id: { type: Schema.Types.ObjectId, ref: 'products', required: true }, // Ensure this is required
    attributes: { type: Map, of: String, default: {} }, // Dynamic attributes
    category_id: { type: Schema.Types.ObjectId, ref: 'categories', required: true }, // Reference to category
    product_image: { type: String, default: '' }, // Default image
    status: { type: Boolean, default: true }, // Default to true
    created_by: { type: Schema.Types.ObjectId, ref: 'users' }, // Required field
    updated_by: { type: Schema.Types.ObjectId, ref: 'users' } // Required field
}, {
    timestamps: true, // Automatically manage createdAt and updatedAt fields
    versionKey: false // Disable version key
});

// Auto-increment plugin for the ID field
productvariationsSchema.plugin(autoIncrement, { model: 'product_variations', field: 'id', startAt: 1 });

const ProductVariations = model<IProductVariations>('product_variations', productvariationsSchema);

export default ProductVariations;
