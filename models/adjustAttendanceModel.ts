import { Schema, model, Document, Types, ObjectId, Mongoose } from "mongoose";

// Document interface
interface adjustDays {
    userId: Schema.Types.ObjectId;
    month: string;
    year: string;
    adjustDay: number;
    createdBy: Schema.Types.ObjectId;
    updatedBy: Schema.Types.ObjectId;
    isDeleted: boolean;
    deletedBy: Schema.Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}

// Schema
const schema: any = new Schema<adjustDays>(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: 'user'
        },
        month: { type: String },
        year: { type: String },
        adjustDay: { type: Number },
        createdBy: {
            type: Schema.Types.ObjectId,
            ref: 'user'
        },
        updatedBy: {
            type: Schema.Types.ObjectId,
            ref: 'user'
        },
        isDeleted: { type: Boolean },
        deletedBy: {
            type: Schema.Types.ObjectId,
            ref: 'user'
        },
        createdAt: { type: Date, default: Date.now },
        updatedAt: { type: Date, default: Date.now }
    }, { timestamps: true, versionKey: false }
);

type UserDocument = Document & adjustDays;
const ADJUST_DAYS = model<UserDocument>("adjustDay", schema);

export default ADJUST_DAYS;
