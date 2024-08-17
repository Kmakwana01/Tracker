import mongoose, { Document, Schema } from 'mongoose';

// Define the interface for the Token document
interface IToken extends Document {
    userId: mongoose.Schema.Types.ObjectId;
    accessToken?: string;
    refreshToken?: string;
    createdAt?: Date;
    updatedAt?: Date;
}

// Define the schema
const tokenSchema: Schema<IToken> = new Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user'
    },
    accessToken: { type: String },
    refreshToken: { type: String },
    createdAt: { type: Date },
    updatedAt: { type: Date }
}, { timestamps: true, versionKey: false });

// Create the model
const Token = mongoose.model<IToken>('token', tokenSchema);

export default Token;
