import mongoose, { Document, Schema } from 'mongoose';

// Define the interface for the Session document
interface ISession extends Document {
    notificationToken: string;
    jwtToken: string;
    userAgent: string;
    ipAddress: string;
    deviceName: string;
    platform: string;
    userId: mongoose.Schema.Types.ObjectId;
    generatedAt?: Date;
    version: string;
    buildNumber: string;
    isActive?: boolean;
    createdAt?: Date;
    updatedAt?: Date;
}

// Define the schema
const sessionSchema: Schema<ISession> = new Schema({
    notificationToken: {
        type: String,
        required: true
    },
    jwtToken: {
        type: String,
        required: true,
        unique: true
    },
    userAgent: {
        type: String,
        required: true,
    },
    ipAddress: {
        type: String,
        required: true,
    },
    deviceName: {
        type: String,
        required: true,
    },
    platform: {
        type: String,
        required: true,
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user',
        required: true
    },
    generatedAt: { type: Date },
    version: {
        type: String,
        required: true,
    },
    buildNumber: {
        type: String,
        required: true,
    },
    isActive: { type: Boolean },
    createdAt: { type: Date },
    updatedAt: { type: Date },
}, {
    timestamps: true,
    versionKey: false
});

// Create the model
const Session = mongoose.model<ISession>('sessions', sessionSchema);

export default Session;
