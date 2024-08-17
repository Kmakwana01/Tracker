import mongoose, { Document, Schema } from 'mongoose';

// Define the interface for the ForgetPassword document
interface IForgetPassword extends Document {
    email: string;
    verificationCode: number;
    userId: mongoose.Schema.Types.ObjectId;
    createdAt?: Date;
    updatedAt?: Date;
}

// Define the schema
const ForgetPasswordSchema: Schema<IForgetPassword> = new Schema({
    email: { type: String, required: true },
    verificationCode: { type: Number, required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'user' },
    createdAt: { type: Date },
    updatedAt: { type: Date }
}, { timestamps: true, versionKey: false });

// Create the model
const ForgetPassword = mongoose.model<IForgetPassword>('forgetPassword', ForgetPasswordSchema);

export default ForgetPassword;