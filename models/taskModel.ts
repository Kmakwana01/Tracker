import mongoose, { Document, Schema } from 'mongoose';

// Define the interface for the Tracker document
interface ITask extends Document {
    userId: mongoose.Schema.Types.ObjectId;
    date: string;
    time: string;
    text : String;
    isDeleted: boolean;
    createdDate?: Date;
    createdAt?: Date;
    updatedAt?: Date;
}

// Define the schema
const taskSchema: Schema<ITask> = new Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user',
        required: true
    },
    date: {
        type: String,
        required: true,
    },
    time: {
        type: String,
        required: true,
    },
    text : String,
    isDeleted: { type: Boolean },
    createdDate : Date,
    createdAt: { type: Date },
    updatedAt: { type: Date }
}, { timestamps: true, versionKey: false });

// Create the model
const Task = mongoose.model<ITask>('tasks', taskSchema);

export default Task;
