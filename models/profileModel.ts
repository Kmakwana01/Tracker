import mongoose, { Document, Schema } from 'mongoose';

// Define the interface for the Profile document
interface IProfile extends Document {
    userId: mongoose.Schema.Types.ObjectId;
    firstName?: string;
    lastName?: string;
    profileImage?: string;
    mobileNumber?: number;
    birthDate?: Date;
    joinDate?: Date;
    deletedBy?: mongoose.Schema.Types.ObjectId | null;
    field?: mongoose.Schema.Types.ObjectId | null;
    createdAt?: Date;
    updatedAt?: Date;
    isDeleted: boolean;
}

// Define the schema
const ProfileSchema: Schema<IProfile> = new Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "user",
        required: true,
        index: true
    },
    firstName: {
        type: String,
        trim: true,
    },
    lastName: {
        type: String,
        trim: true,
    },
    profileImage: {
        type: String,
        trim: true
    },
    mobileNumber: {
        type: Number,
        trim: true
    },
    birthDate: { type: Date },
    joinDate: { type: Date },
    deletedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "user",
        default: null,
    },
    field: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "field",
        index: true
    },
    createdAt: { type: Date },
    updatedAt: { type: Date },
    isDeleted: {
        type: Boolean,
        required: true
    },

}, { timestamps: true, versionKey: false });

// Create the model
const Profile = mongoose.model<IProfile>('profile', ProfileSchema);

export default Profile;
