import mongoose, { Document, Schema } from 'mongoose';

// Define the interface for the Field document
interface IField extends Document {
    name: string;
    createdAt?: Date;
    updatedAt?: Date;
}

// Define the schema
const fieldSchema: Schema<IField> = new Schema({
    name: { type: String, required: true },
    createdAt: { type: Date },
    updatedAt: { type: Date }
}, { timestamps: true, versionKey: false });

// Create the model
const Field = mongoose.model<IField>('field', fieldSchema);

export default Field;