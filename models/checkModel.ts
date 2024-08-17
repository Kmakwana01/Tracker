import mongoose, { Document, Schema } from 'mongoose';

// Define the interface for the Field document
interface IField extends Document {
    apiCallTime: String;
    userId : mongoose.Schema.Types.ObjectId;
    url : mongoose.Schema.Types.ObjectId;
    response : String;
    createdAt?: Date;
    updatedAt?: Date;
}

// Define the schema
const fieldSchema: Schema<IField> = new Schema({
    apiCallTime: { type: String },
    url: { type: String },
    response: { type: Array },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'user' },
    createdAt: { type: Date },
    updatedAt: { type: Date }
}, { timestamps: true, versionKey: false });

// Create the model
const Field = mongoose.model<IField>('check', fieldSchema);

export default Field;