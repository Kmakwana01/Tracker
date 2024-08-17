import { Request, Response } from 'express';
import moment from 'moment-timezone';
import { main, extractLineNumber } from './emailController';
import TASK from '../models/taskModel';
import mongoose from 'mongoose';
import TRACKER from '../models/trackerModel';
import { calculateTimeDifference } from '../utils/handler';
import PROFILE from '../models/profileModel';

interface updatedRequest extends Request {
    query: {
        userId: string;
        date: string;
        monthly: string;
    };
}

export const addTask = async (req : Request, res : Response) => {

    try {
        let { date , text }  = req.body;

        switch (true) {
            case !date:
                throw new Error('date is required.');
            case !text:
                throw new Error('text is required.');
        }
        
        if (!moment(date, moment.ISO_8601, true).isValid()) {
            throw new Error('Please provide a valid date in ISO 8601 format in dateFrom.');
        }

        let dateObject = moment(date).format('DD/MM/YYYY');
        let timeSet = moment(date).format('HH:mm:ss');

        let isTask = await TASK.findOne({ userId : req.userId, date : dateObject });
        if(isTask) throw new Error('Task already exists for this date.')

        const task = await TASK.create({
            userId : req.userId,
            date : dateObject,
            time : timeSet,
            text : text,
            createdDate : date,
        })

        res.status(200).json({
            status: 200,
            message: "task create Successfully.",
            data: task
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

export const updateTask = async (req : Request, res : Response) => {
    try {

        const { taskId , text } = req.body;

        if(!taskId) throw new Error('taskId is required.');
        if(!text) throw new Error('text is required.');

        let findTask = await TASK.findById(taskId);
        if(!findTask) throw new Error('task not found.');

        let updatedTask = await TASK.findByIdAndUpdate(taskId,{
            text : text
        },{ new : true })

        res.status(200).json({
            status: 200,
            message: "task Update Successfully.",
            data : updatedTask
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

export const deleteTask = async (req : Request, res : Response) => {
    try {

        const { taskId } = req.query;

        if(!taskId) throw new Error('taskId is required.');

        let findTask = await TASK.findById(taskId);
        if(!findTask) throw new Error('task not found.');
        
        let taskDelete = await TASK.findOneAndDelete({ _id : taskId });

        res.status(200).json({
            status: 200,
            message: "task Delete Successfully.",
            data : taskDelete
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

function formatTime(durationInMilliseconds : any) {

    function padZero(num : any) {
        return num < 10 ? '0' + num : num;
    }

    let totalSeconds = durationInMilliseconds / 1000;
    let hours = Math.floor(totalSeconds / 3600);
    let minutes = Math.floor((totalSeconds % 3600) / 60);
    let seconds = Math.floor(totalSeconds % 60);
    let formattedTime = `${padZero(hours)}:${padZero(minutes)}:${padZero(seconds)}`;

    return formattedTime;
}

export const getTasksList = async (req : updatedRequest, res : Response) => {

    try {

        let { date , userId , monthly } = req.query;

        if(typeof monthly === "string"){
            monthly = JSON.parse(monthly);
        }

        if(!date){
            throw new Error('date is required.')
        } else if (!moment(date, 'DD/MM/YYYY', true).isValid()) {
            throw new Error('Please provide a valid date in dd/mm/yyyy format.');
        } 

        let query : any = {};

        if(userId){
            let isValidUserId = mongoose.Types.ObjectId.isValid(userId)
            if(!isValidUserId) throw new Error('Please provide a valid userId.')
            query.userId = userId
        }

        if (monthly) {

            const month = moment(date, 'DD/MM/YYYY').format('MM');
            const year = moment(date, 'DD/MM/YYYY').format('YYYY');
            query.date = { $regex: new RegExp(`^\\d{2}/${month}/${year}$`) };

        } else {

            query.date = date;
        }

        const taskFind = await TASK.find(query)  

        const response : any = []

        for (const iterator of taskFind) {
            
            const trackerData : any = await TRACKER.find({
                userId: iterator.userId,
                date : iterator.date
            })

            const findProfile : any = await PROFILE.findOne({ userId : iterator.userId })

            let totalActiveLoggedTime = 0;
            let totalInactiveLoggedTime = 0;
    
            for (const item of trackerData) {
    
                let differentTime = await calculateTimeDifference(item.startTime, item.endTime);
    
                if (item.isActive) {
                    totalActiveLoggedTime += differentTime
                } else {
                    totalInactiveLoggedTime += differentTime
                }

            }

            let updatedTask : any = JSON.parse(JSON.stringify(iterator))
            updatedTask.firstName = findProfile?.firstName ?? findProfile.firstName
            updatedTask.lastName = findProfile?.lastName ?? findProfile.lastName

            response.push({
                totalActiveLoggedTime: await formatTime(totalActiveLoggedTime),
                totalInactiveLoggedTime: await formatTime(totalInactiveLoggedTime),
                totalLoggedTime: await formatTime(totalActiveLoggedTime + totalInactiveLoggedTime),
                task : updatedTask
            })
        }
        
        res.status(200).json({
            status: 200,
            message: "task get Successfully.",
            data : response
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
