import mongoose, { Document, Schema } from 'mongoose';

// Define the interface for the Role document
interface IRole extends Document {
    subscriptionId?: mongoose.Schema.Types.ObjectId;
    name?: string;
    createdAt?: Date;
    updatedAt?: Date;
}

// Define the schema
const roleSchema: Schema<IRole> = new Schema({
    subscriptionId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "subscription",
        index: true
    },
    name: { type: String },
    createdAt: { type: Date },
    updatedAt: { type: Date }
}, { timestamps: true, versionKey: false });

// Create the model
const Role = mongoose.model<IRole>('role', roleSchema);

export default Role;
