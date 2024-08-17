import TRACKER from '../models/trackerModel';
import USER from '../models/userModel';
import TRACKER_IMAGE from '../models/trackerImageModel';
import { formatFileSize, isBoolean, calculateTimeDifference } from '../utils/handler';
import moment from 'moment';
import mongoose from 'mongoose';
import { Request, Response } from 'express';
import CHECK from '../models/checkModel'
import { main, extractLineNumber } from './emailController';

interface CustomRequest extends Request {
    query: {
        employeeId: string;
        date: string;
    };
}

export const trackerFileUpload = async (req : Request , res : Response) => {
    try {

        const trackerFile = req.files?.filter((file : any) => file.fieldname === 'trackerFile')[0];

        if (!trackerFile) {
            throw new Error('Please upload a file.')
        }

        const trackerImage = await TRACKER_IMAGE.create({
            filename: trackerFile.filename,
            mimeType: trackerFile.mimetype,
            fileSize: await formatFileSize(trackerFile.size)
        })

        res.status(201).json({
            status: 201,
            message: 'File uploaded successfully.',
            data: trackerImage
        })

    } catch (error : any ) {
        if (error && error.constructor !== Error) {
            let line = extractLineNumber(error);
            main(error, req, line);
        }
        res.status(400).json({
            status: 'Failed',
            message: error.message
        })
    }
};

export const trackerCreate = async (req : Request , res : Response) => {
    try {

        let { data  } = req.body 

        if (!data || data?.length === 0) {
            throw new Error('Please provide a data.');
        }

        const response = [];

        for (const key of data) {

            let dateObject = moment(key.startTime).utc().format('DD/MM/YYYY');
            let timeSet = moment(key.startTime).utc().format('HH:mm:ss');

            const existingTracker = await TRACKER.findOne({
                userId: req.userId,
                startTime: new Date(key.startTime),
                endTime: new Date(key.endTime)
            });

            if(!existingTracker){
                let data = await TRACKER.create({
                    userId: req.userId,
                    date: dateObject,
                    time: timeSet,
                    trackerImageId: key.trackerImageId,
                    key: key.key,
                    mouse: key.mouse,
                    inActiveKey: key.inActiveKey,
                    startTime: new Date(key.startTime),
                    endTime: new Date(key.endTime),
                    isActive: isBoolean(key.isActive) ? key.isActive : false,
                    isDeleted: false
                })
                response.push(data);
            } else {
                throw new Error(`Tracker exists for time range ${key.startTime} - ${key.endTime}.`);
            }
        }

        let dateAndTime = moment().tz('Asia/Kolkata').format('DD/MM/YYYY hh:mm:ss A');
        
        await CHECK.create({
            apiCallTime : dateAndTime,
            userId : req.userId,
            url : req.url,
            response : response,
        })

        res.status(201).json({
            status: 201,
            message: 'Tracker data created successfully.',
            data: response
        })

    } catch (error : any) {
        if (error && error.constructor !== Error) {
            let line = extractLineNumber(error);
            main(error, req, line);
        }
        res.status(400).json({
            status: 'Failed',
            message: error.message
        })
    }
};

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

export const getMonthlyData = async (req : CustomRequest , res : Response) => {

        try {
            const { employeeId, date } = req.query;

            if (!employeeId) {
                throw new Error('Please provide an employeeId.');
            } else if (!date) {
                throw new Error('Please provide a date.');
            } else if (!mongoose.Types.ObjectId.isValid(employeeId)) {
                throw new Error('please provide a valid objectId for employeeId.');
            } else if (!moment(date, 'MM/YYYY', true).isValid()) {
                throw new Error('Please provide a valid date in mm/yyyy format.');
            }

            const datePattern = new RegExp(`^\\d{2}/${date}$`);

            let findEmployee = await USER.findById(employeeId)
            if (!findEmployee) throw new Error('please provide valid employeeId.')

            const trackerData = await TRACKER.find({
                userId: employeeId,
                date: { $regex: datePattern }
            });

            const monthlyData = [];
            let totalKeyboardCount = 0;
            let totalMouseCount = 0;
            let totalActiveLoggedTime = 0;
            let totalInactiveLoggedTime = 0;

            for (let day = 1; day <= 31; day++) {

                const formattedDay = day < 10 ? '0' + day : '' + day;
                const dateString = formattedDay + '/' + date;

                const dayData = trackerData.filter(item => item.date === dateString);

                if (dayData.length) {

                    let keyboardCount = 0;
                    let mouseCount = 0;
                    let activeLoggedTime = 0;
                    let inactiveLoggedTime = 0;

                    for (const item of dayData) {

                        keyboardCount += item.key;
                        mouseCount += item.mouse;

                        let differentTime = await calculateTimeDifference(item.startTime, item.endTime);

                        if (item.isActive) {
                            activeLoggedTime += differentTime
                        } else {
                            inactiveLoggedTime += differentTime
                        }
                        
                    }

                    totalKeyboardCount += keyboardCount;
                    totalMouseCount += mouseCount;
                    totalActiveLoggedTime += activeLoggedTime;
                    totalInactiveLoggedTime += inactiveLoggedTime;

                    monthlyData.push({
                        date: dateString,
                        keyboardCount: keyboardCount,
                        mouseCount: mouseCount,
                        activeLoggedTime: formatTime(activeLoggedTime),
                        inactiveLoggedTime: formatTime(inactiveLoggedTime),
                        totalLoggedTime: formatTime(activeLoggedTime + inactiveLoggedTime)
                    });
                }
            }

            let response = {
                totalKeyboardCount: totalKeyboardCount,
                totalMouseCount: totalMouseCount,
                totalActiveLoggedTime: formatTime(totalActiveLoggedTime),
                totalInactiveLoggedTime: formatTime(totalInactiveLoggedTime),
                totalLoggedTime: formatTime(totalActiveLoggedTime + totalInactiveLoggedTime),
                monthlyData
            }

            res.status(200).json({
                status: 200,
                message: 'Monthly tracker data retrieved successfully.',
                data: response
            });

        } catch (error : any) {
            if (error && error.constructor !== Error) {
                let line = extractLineNumber(error);
                main(error, req, line);
            }
            res.status(400).json({
                status: 'Failed',
                message: error.message
            });
        }
    };

export const getDailyData = async (req : CustomRequest , res : Response) => {
    try {

        const { employeeId, date } = req.query;

        if (!employeeId) {
            throw new Error('Please provide an employeeId.');
        } else if (!date) { // dd/mm/yyyy
            throw new Error('Please provide a date.');
        } else if (!mongoose.Types.ObjectId.isValid(employeeId)) {
            throw new Error('please provide a valid objectId for employeeId.');
        } else if (!moment(date, 'DD/MM/YYYY', true).isValid()) {
            throw new Error('Please provide a valid date in dd/mm/yyyy format.');
        }

        let findEmployee = await USER.findById(employeeId)
        if (!findEmployee) throw new Error('please provide valid employeeId.')

        const trackerData : any = await TRACKER.find({
            userId: employeeId,
            date: date
        });

        const dailyData = []
        let totalKeyboardCount = 0;
        let totalMouseCount = 0;
        let totalActiveLoggedTime = 0;
        let totalInactiveLoggedTime = 0;

        for (const item of trackerData) {

            totalKeyboardCount += item.key;
            totalMouseCount += item.mouse;

            let differentTime = await calculateTimeDifference(item.startTime, item.endTime);

            if (item.isActive) {
                totalActiveLoggedTime += differentTime
            } else {
                totalInactiveLoggedTime += differentTime
            }

            let trackerImage;
            if (item.trackerImageId) {
                let image = await TRACKER_IMAGE.findOne({ _id: item.trackerImageId })
                if (image) {
                    trackerImage = `${req.protocol}://${req.get('host')}/images/${image.filename}`
                }
            }

            dailyData.push({...item._doc , trackerImage : trackerImage ? trackerImage : null});
        }

        const response : any = {
            totalKeyboardCount,
            totalMouseCount,
            totalActiveLoggedTime: formatTime(totalActiveLoggedTime),
            totalInactiveLoggedTime: formatTime(totalInactiveLoggedTime),
            totalLoggedTime: formatTime(totalActiveLoggedTime + totalInactiveLoggedTime),
            dailyData
        }

        res.status(200).json({
            status: 200,
            message: 'Daily tracker data retrieved successfully.',
            data: response
        });

    } catch (error : any) {
        if (error && error.constructor !== Error) {
            let line = extractLineNumber(error);
            main(error, req, line);
        }
        res.status(400).json({
            status: 'Failed',
            message: error.message
        });
    }
}
