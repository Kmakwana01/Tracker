import mongoose, { Document, Schema } from 'mongoose';

// Define the interface for the Subscription document
interface ISubscription extends Document {
    userId: mongoose.Schema.Types.ObjectId;
    subscriptionStartDate?: Date;
    subscriptionEndDate?: Date;
    price?: string;
    durationInDays?: number;
    createdAt?: Date;
    updatedAt?: Date;
}

// Define the schema
const subscriptionSchema: Schema<ISubscription> = new Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user'
    },
    subscriptionStartDate: { type: Date },
    subscriptionEndDate: { type: Date },
    price: { type: String },
    durationInDays: { type: Number },
    createdAt: { type: Date },
    updatedAt: { type: Date }
}, { timestamps: true, versionKey: false });

// Create the model
const Subscription = mongoose.model<ISubscription>('subscription', subscriptionSchema);

export default Subscription;
