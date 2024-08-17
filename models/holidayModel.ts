import { Schema, model, Document, Types, ObjectId, Mongoose } from "mongoose";

// Document interface
interface holiday {
    name: string;
    date: string;
    addedBy: Schema.Types.ObjectId;
    isOnSunday: boolean;
    isDeleted: boolean;
    deletedBy: Schema.Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}

// Schema
const schema: any = new Schema<holiday>(
    {
        name: { type: String },
        date: { type: String },
        addedBy: {
            type: Schema.Types.ObjectId,
            ref: 'user'
        },
        isOnSunday: { type: Boolean },
        isDeleted: { type: Boolean },
        deletedBy: {
            type: Schema.Types.ObjectId,
            ref: 'user',
            default: null
        },
        createdAt: { type: Date, default: Date.now },
        updatedAt: { type: Date, default: Date.now },
    }, { timestamps: true, versionKey: false }
);

type UserDocument = Document & holiday;
const HOLIDAY = model<UserDocument>("holiday", schema);

export default HOLIDAY ;
