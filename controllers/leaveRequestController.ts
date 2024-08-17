import { Request, Response } from 'express';
import { main, extractLineNumber } from './emailController';
import LEAVE_REQUEST from '../models/leaveRequestModel'
import USER from '../models/userModel'
import moment from 'moment';
import mongoose from 'mongoose';
import ROLE from '../models/roleModel';
import { SendEmail } from '../utils/handler';
import PROFILE from '../models/profileModel'

interface updatedRequest extends Request {
    query: {
        userId: string;
        dateFrom: string;
        dateTo: string;
        monthly: string;
        leaveRequestId : string;
        status : string;
    };
}

export const addRequest = async (req : Request, res : Response) => {

    try {
    
        let { leaveType , reason, dateFrom, dateTo, timeFrom, timeTo } = req.body;
        
        if(!['oneDay','multiDay','halfDay'].includes(leaveType)) throw new Error('please provide valid leaveType.');
        if(!dateFrom) throw new Error('dateFrom is required.');
        if(!reason) throw new Error('reason is required.');
        if (!moment(dateFrom, moment.ISO_8601, true).isValid()) {
            throw new Error('Please provide a valid date in ISO 8601 format in dateFrom.');
        }

        let emailText : any = {
            leaveType : leaveType,
            reason : reason,
            dateFrom : dateFrom
        }

        if(leaveType === 'oneDay'){

            dateTo = null;

        } else if(leaveType === 'multiDay'){

            if(!dateTo) throw new Error('dateTo is required.');
            if (!moment(dateTo, moment.ISO_8601, true).isValid()) {
                throw new Error('Please provide a valid date in ISO 8601 format in dateTo.');
            }

            emailText.dateTo = dateTo;

        } else if(leaveType === 'halfDay'){

            if(!timeFrom) throw new Error('timeFrom is required.');
            if(!timeTo) throw new Error('timeTo is required.');
            if(!moment(req.body.timeFrom, 'HH:mm:ss', true).isValid()){
                throw new Error('Invalid timeFrom format. Please provide the date in HH:mm:ss format.');
            } else if(!moment(req.body.timeTo, 'HH:mm:ss', true).isValid()){
                throw new Error('Invalid timeTo format. Please provide the date in HH:mm:ss format.');
            }
            dateTo = null;
            emailText.timeFrom = timeFrom;
            emailText.timeTo = timeTo;
        }

        const leaveRequest : any = await LEAVE_REQUEST.create({
                userId: req.userId,
                leaveType : leaveType,
                dateFrom: dateFrom,
                dateTo: dateTo ?? null,
                timeFrom: timeFrom ?? null, 
                timeTo: timeTo ?? null, 
                reason: reason,
                status: 'Pending',
                respondedBy : null,
                isDeleted: false,
        })

        let findCurrentUser = await PROFILE.findOne({ userId : req.userId })
        const firstName = findCurrentUser?.firstName || ''; // Replace with actual logic to get the first name
        const lastName = findCurrentUser?.lastName || '';

        let findAdminRole = await ROLE.findOne({ name : "admin" });
        if(findAdminRole){
            let findAdminUsers = await USER.find({ role : findAdminRole._id })
            let findEmails = findAdminUsers.map((user) => user.email);
            console.log('first',findAdminUsers)
             const emailSubject = 'Leave Request';
             const emailBody = `
                 Leave Type: ${emailText.leaveType.trim()}\n
User Name: ${firstName.trim()} ${lastName.trim()}\n
Reason: ${emailText.reason.trim()}
Date From: ${moment(emailText.dateFrom).format('DD/MM/YYYY').trim()}
${emailText.dateTo ? `Date To: ${moment(emailText.dateTo).format('DD/MM/YYYY').trim()}` : ''}
${emailText.timeFrom ? `Time From: ${emailText.timeFrom.trim()}` : ''}
${emailText.timeTo ? `Time To: ${emailText.timeTo.trim()}` : ''}

             `;

            for (const email of findEmails) {
                SendEmail(email,emailSubject,emailBody)
            }
        }

        res.status(200).json({
            status: 200,
            message: `${leaveType} Leave submit Successfully.`,
            data: leaveRequest
        });

    } catch (error : any) {

        if (error && error.constructor !== Error) {
            let line = extractLineNumber(error);
            main(error, req, line);
        }

        res.status(400).json({
            status: "Failed",
            message: error.message,
        });

    }
}

export const getLeaveRequest = async (req : updatedRequest, res : Response) => {

    try {

        let { dateFrom, dateTo , userId , monthly } = req.query as any;

       
        if(typeof monthly === "string"){
            monthly = JSON.parse(monthly);
        }
        if(!dateFrom){
            throw new Error('dateFrom is required.')
        } else if(!moment(dateFrom, 'DD/MM/YYYY', true).isValid()){
            throw new Error('Please provide valid dates in DD/MM/YYYY format for dateFrom.')
        }

        dateFrom = moment(dateFrom,'DD/MM/YYYY').toISOString();

        let query : any = {};

        // if(req.role === 'admin'){
        //     query.status = 'Pending';
        // }

        if(userId){
            let isValidUserId = mongoose.Types.ObjectId.isValid(userId)
            if(!isValidUserId) throw new Error('Please provide a valid userId.')
            query.userId = new mongoose.Types.ObjectId(userId)
        }

        if (monthly) {

            const month = moment(dateFrom).month();
            const year = moment(dateFrom).year();

            query.dateFrom = {
                $gte: new Date(year, month, 1),
                $lt: new Date(year, month + 1, 1)
            };

        } else if(dateTo){

            if(!moment(dateTo, 'DD/MM/YYYY', true).isValid()){
                throw new Error('Please provide valid dates in DD/MM/YYYY format for dateTo.')
            }
            dateTo = moment(dateTo,'DD/MM/YYYY').toISOString();


            const startDateFrom = new Date(moment(dateFrom).startOf('day').toISOString());
            const endDateTo = new Date(moment(dateTo).endOf('day').toISOString());
      
            query.dateFrom = {
              $gte: startDateFrom,
              $lte: endDateTo
            };

        } else {

            query.dateFrom = {
                $gte: new Date(moment(dateFrom).startOf('day').toISOString()),
                $lte: new Date(moment(dateFrom).endOf('day').toISOString()),
            };

        }

        const requestFind = await LEAVE_REQUEST.aggregate([
            {
                $match : {
                    ...query
                }
            },
            {
                $lookup : {
                    from : "profiles",
                    foreignField : "userId",
                    localField : "userId",
                    as : "profile",
                }
            },
            {
                $unwind : '$profile'
            }
        ])

        res.status(200).json({
            status: 200,
            message: "Leave Request Get Successfully.",
            data : requestFind
        });

    } catch (error : any) {

        if (error && error.constructor !== Error) {
            let line = extractLineNumber(error);
            main(error, req, line);
        }
        res.status(400).json({
            status: "Failed",
            message: error.message,
        });
    }
}

export const getLeaveRequestByStatus = async (req : updatedRequest, res : Response) => {

    try {

        let { userId ,status } = req.query as any;

        if(!status) throw new Error('leaveType is required.');
       
        let query : any = {
            status  : status
        };

        if(userId){
            let isValidUserId = mongoose.Types.ObjectId.isValid(userId)
            let findUser = await USER.findOne({ _id : userId })
            if(!isValidUserId || !findUser) throw new Error('Please provide a valid userId.')
            query.userId = new mongoose.Types.ObjectId(userId)
        }

        const requestFind = await LEAVE_REQUEST.aggregate([
            {
                $match : query
            },
            {
                $lookup : {
                    from : "profiles",
                    foreignField : "userId",
                    localField : "userId",
                    as : "profile",
                }
            },
            {
                $unwind : '$profile'
            }
        ])

        res.status(200).json({
            status: 200,
            message: "Leave Request Get Successfully.",
            data : requestFind
        });

    } catch (error : any) {

        if (error && error.constructor !== Error) {
            let line = extractLineNumber(error);
            main(error, req, line);
        }
        res.status(400).json({
            status: "Failed",
            message: error.message,
        });
    }
}

export const updateRequest = async (req : Request, res : Response) => {

    try {
    
        let { leaveType , reason, dateFrom, dateTo, timeFrom, timeTo , leaveRequestId } = req.body;
        
        if(!leaveRequestId) throw new Error('leaveRequestId is required.');
        if(!['oneDay','multiDay','halfDay'].includes(leaveType)) throw new Error('please provide valid leaveType.');
        if(!dateFrom) throw new Error('dateFrom is required.');
        if(!reason) throw new Error('reason is required.');
        if (!moment(dateFrom, moment.ISO_8601, true).isValid()) {
            throw new Error('Please provide a valid date in ISO 8601 format in dateFrom.');
        }

        let findLeaveRequest = await LEAVE_REQUEST.findOne({
            _id : leaveRequestId
        })

        if(!findLeaveRequest) throw new Error('please provide a valid leaveRequestId.');

        if(leaveType === 'oneDay'){

            dateTo = null;

        } else if(leaveType === 'multiDay'){

            if(!dateTo) throw new Error('dateTo is required.');
            if (!moment(dateTo, moment.ISO_8601, true).isValid()) {
                throw new Error('Please provide a valid date in ISO 8601 format in dateTo.');
            }

        } else if(leaveType === 'halfDay'){

            if(!timeFrom) throw new Error('timeFrom is required.');
            if(!timeTo) throw new Error('timeTo is required.');
            if(!moment(req.body.timeFrom, 'HH:mm:ss', true).isValid()){
                throw new Error('Invalid timeFrom format. Please provide the date in HH:mm:ss format.');
            } else if(!moment(req.body.timeTo, 'HH:mm:ss', true).isValid()){
                throw new Error('Invalid timeTo format. Please provide the date in HH:mm:ss format.');
            }
            dateTo = null;

        }

        const leaveRequest = await LEAVE_REQUEST.findByIdAndUpdate(leaveRequestId,{
                userId: req.userId,
                leaveType : leaveType,
                dateFrom: dateFrom,
                dateTo: dateTo ?? null,
                timeFrom: timeFrom ?? null, 
                timeTo: timeTo ?? null, 
                reason: reason,
                respondedBy : null,
                isDeleted: false,
        },{ new : true })


        res.status(200).json({
            status: 200,
            message: `${leaveType} Leave submit Successfully.`,
            data: leaveRequest
        });

    } catch (error : any) {

        if (error && error.constructor !== Error) {
            let line = extractLineNumber(error);
            main(error, req, line);
        }

        res.status(400).json({
            status: "Failed",
            message: error.message,
        });

    }
}

export const getLeaveRequestById = async (req : updatedRequest, res : Response) => {

    try {

        let { leaveRequestId } = req.query as any;
        
        if(!leaveRequestId) throw new Error('id is required.');

        if(!mongoose.Types.ObjectId.isValid(leaveRequestId)) throw new Error('please provide valid object id.');

        let leaveRequestFind = await LEAVE_REQUEST.findOne({ _id : leaveRequestId , isDeleted : false })

        if(!leaveRequestFind) throw new Error('please provide valid id.');

        res.status(200).json({
            status: 200,
            message: "Leave Request Get Successfully.",
            data : leaveRequestFind
        });

    } catch (error : any) {

        if (error && error.constructor !== Error) {
            let line = extractLineNumber(error);
            main(error, req, line);
        }
        res.status(400).json({
            status: "Failed",
            message: error.message,
        });
    }
}

export const statusChange = async (req : updatedRequest, res : Response) => {
    try {
    
        let { status , leaveRequestId } = req.query;

        if(!leaveRequestId) throw new Error('leaveRequestId is required.');
        if(!status) throw new Error('status is required.');
        if(!mongoose.Types.ObjectId.isValid(leaveRequestId)) throw new Error('please provide a valid objectId for leaveRequestId.')
        if(!['Pending','Declined','Approved'].includes(status)) throw new Error('please provide valid status.');

        const leaveRequest :any = await LEAVE_REQUEST.findOne({
            _id : leaveRequestId  
        })

        if(!leaveRequest) throw new Error('leaveRequest not found.');
        if(leaveRequest.status !== 'Pending') throw new Error('Leave request status is not pending.')

        leaveRequest.status = status;
        leaveRequest.respondedBy = req.userId;
        await leaveRequest.save()


        res.status(200).json({
            status: 200,
            message: `${leaveRequest.leaveType} Leave Request Status Updated Successfully.`,
            data: leaveRequest
        });

    } catch (error : any) {

        if (error && error.constructor !== Error) {
            let line = extractLineNumber(error);
            main(error, req, line);
        }

        res.status(400).json({
            status: "Failed",
            message: error.message,
        });

    }
}

export const deleteLeaveRequest = async (req : Request, res : Response) => {
    try {

        const { leaveRequestId } = req.query;

        if(!leaveRequestId) throw new Error('LeaveRequestId is required.');

        let findLeaveRequest = await LEAVE_REQUEST.findById(leaveRequestId);
        if(!findLeaveRequest) throw new Error('findLeaveRequest not found.');
        
        let leaveRequestDelete = await LEAVE_REQUEST.findOneAndDelete({ _id : leaveRequestId });

        res.status(200).json({
            status: 200,
            message: "LeaveRequest Delete Successfully.",
            data : leaveRequestDelete
        });

    } catch (error : any) {

        if (error && error.constructor !== Error) {
            let line = extractLineNumber(error);
            main(error, req, line);
        }
        
        res.status(400).json({
            status: "Failed",
            message: error.message,
        });
    }
}