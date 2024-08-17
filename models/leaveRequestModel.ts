import mongoose, { Document, Schema } from 'mongoose';

enum typeLeave {
    oneDay = "oneDay",
    multiDay = "multiDay",
    halfDay = "halfDay",
}

enum statusLeave {
    pending = "Pending",    
    declined = "Declined",
    approved = "Approved",
}

// Define the interface for the ForgetPassword document
interface ILeaveRequest extends Document {
    userId : Schema.Types.ObjectId;
    leaveType : typeLeave;
    dateFrom : Date;
    dateTo : Date;
    timeFrom : string;
    timeTo : string;
    reason : string;
    status : statusLeave;
    isDeleted : boolean;
    respondedBy : Schema.Types.ObjectId;
    createdAt : Date;
    updatedAt : Date;
}

const leaveRequestSchema = new Schema<ILeaveRequest>(
    {
        userId : {
            type : Schema.Types.ObjectId,
            ref : 'user'
        },
        leaveType : { 
            type : String,
            enum : Object.values(typeLeave)
        },
        respondedBy : {
            type : Schema.Types.ObjectId,
            ref : 'user'
        },
        status : { 
            type : String,
            enum : Object.values(statusLeave)
        },
        dateFrom : { type : Date },
        dateTo : { type : Date },
        timeFrom : { type : String },
        timeTo : { type : String },
        reason : { type : String },
        isDeleted: { type: Boolean },
        createdAt : { type: Date },
        updatedAt : { type: Date }
    },
    { 
        timestamps: true, 
        versionKey: false
     }
);


// Create the model
const ForgetPassword = mongoose.model<ILeaveRequest>('leaverequest', leaveRequestSchema);

export default ForgetPassword;