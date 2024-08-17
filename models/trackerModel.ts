import mongoose, { Document, Schema } from 'mongoose';

// Define the interface for the Tracker document
interface ITracker extends Document {
    userId: mongoose.Schema.Types.ObjectId;
    trackerImageId?: mongoose.Schema.Types.ObjectId | null;
    date: string;
    key: number;
    mouse: number;
    inActiveKey: number;
    time: string;
    startTime: Date;
    endTime: Date;
    isActive: boolean;
    deletedBy?: mongoose.Schema.Types.ObjectId | null;
    isDeleted: boolean;
    createdAt?: Date;
    updatedAt?: Date;
}

// Define the schema
const trackerSchema: Schema<ITracker> = new Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user',
        required: true
    },
    trackerImageId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'trackerImage',
        default: null
    },
    date: {
        type: String,
        required: true,
    },
    key: {
        type: Number,
        required: true,
        min: 0
    },
    mouse: {
        type: Number,
        required: true,
        min: 0
    },
    inActiveKey: {
        type: Number,
        required: true,
        min: 0
    },
    time: {
        type: String,
        required: true
    },
    startTime: {
        type: Date,
        required: true
    },
    endTime: {
        type: Date,
        required: true
    },
    isActive: {
        type: Boolean,
        required: true,
        default: true
    },
    deletedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user',
        default: null
    },
    isDeleted: { type: Boolean },
    createdAt: { type: Date },
    updatedAt: { type: Date }
}, { timestamps: true, versionKey: false });

// Create the model
const Tracker = mongoose.model<ITracker>('tracker', trackerSchema);

export default Tracker;
