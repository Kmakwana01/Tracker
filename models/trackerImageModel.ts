import mongoose, { Document, Schema } from 'mongoose';

// Define the interface for the TrackerImage document
interface ITrackerImage extends Document {
    filename?: string;
    mimeType?: string;
    fileSize?: string;
    createdAt?: Date;
    updatedAt?: Date;
}

// Define the schema
const trackerImageSchema: Schema<ITrackerImage> = new Schema({
    filename: { type: String },
    mimeType: { type: String },
    fileSize: { type: String },
    createdAt: { type: Date },
    updatedAt: { type: Date }
}, { timestamps: true, versionKey: false });

// Create the model
const TrackerImage = mongoose.model<ITrackerImage>('trackerImage', trackerImageSchema);

export default TrackerImage;
