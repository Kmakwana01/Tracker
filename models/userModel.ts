import mongoose, { Document, Schema } from 'mongoose';

// Define the interface for the User document
interface IUser extends Document {
    email: string;
    password: string;
    role: mongoose.Schema.Types.ObjectId;
    subscriptionId: mongoose.Schema.Types.ObjectId;
    createdBy?: mongoose.Schema.Types.ObjectId | null;
    deletedBy?: mongoose.Schema.Types.ObjectId | null;
    isDeleted: boolean;
    createdAt?: Date;
    updatedAt?: Date;
}

// Define the schema
const UserSchema: Schema<IUser> = new Schema({
    email: {
        type: String,
        required: [true, 'Email is required'],
        validate: {
            validator: function (v: string) {
                return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
            },
            message: (props: { value: string }) => `${props.value} is not a valid email address!`
        }
    },
    password: { type: String, required: true },
    role: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'role',
        required: true,
        index: true
    },
    subscriptionId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'subscription',
        required: true,
        index: true
    },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'user', index: true },
    deletedBy: { type: Schema.Types.ObjectId, ref: 'user', default: null },
    isDeleted: { type: Boolean, required: true },
    createdAt: { type: Date },
    updatedAt: { type: Date }
}, { timestamps: true, versionKey: false });

// Create the model
const User = mongoose.model<IUser>('user', UserSchema);

export default User;
