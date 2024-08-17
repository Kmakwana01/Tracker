import { Response, Request, NextFunction } from 'express';
import USER from '../models/userModel'
import TRACKER from '../models/trackerModel'
import LEAVE_REQUEST from '../models/leaveRequestModel'
import PROFILE from '../models/profileModel'
import HOLIDAY from '../models/holidayModel';
import ROLE from '../models/roleModel'
import { calculateMultiDayLeaveDuration, calculateTimeDifference, countSundaysInMonth, formatTime, getDaysInMonth, millisecondsToTimeString } from '../utils/handler';
import moment from 'moment';

// export const getAttendance = async (req: Request, res: Response) => {
//     try {

//         let { date } = req.query as any;

//         if (!moment(date, "DD/MM/YYYY", true).isValid()) throw new Error('Please provide a valid date format.');

//         let dateFormat = moment(date, "DD/MM/YYYY", true)
//         let year = dateFormat.year();
//         let month = dateFormat.month() + 1;

//         const daysInMonth = getDaysInMonth(month, year);
//         const countOfSunday = countSundaysInMonth(month, year);

//         let dateFormatForMonthAndYear = moment(date, "DD/MM/YYYY", true).format('MM/YYYY');
//         const regexForMonthAndYear = new RegExp(`^\\d{2}/${dateFormatForMonthAndYear}$`);

//         let countOfHoliday = await HOLIDAY.find({
//             date: {
//                 $regex: regexForMonthAndYear
//             },
//             isOnSunday: false
//         }).countDocuments();

//         let workingDays = daysInMonth - (countOfSunday + countOfHoliday);

//         let findRole: any = await ROLE.findOne({ name: 'employee' })
//         let allUser = await USER.find({ role: findRole?._id, isDeleted: false })
//         let userIds = allUser.map((user) => user?.id)
//         let allProfile : any = await PROFILE.find({ userId: { $in: userIds } }).populate('userId');

//         const attendanceData = await Promise.all(
//             allProfile.map(async (profile :any) => ({
//                 userId: profile.userId._id,
//                 data: await calculateMonthlyAttendance(dateFormatForMonthAndYear, profile.userId._id)
//             }))
//         );

//         console.log(attendanceData)

//         res.status(201).json({
//             status: 201,
//             message: 'Success',
//             data: allProfile
//         })

//     } catch (error: any) {
//         res.status(400).json({
//             status: 'Fail',
//             message: error.message
//         })
//     }
// }

// let calculateMonthlyAttendance = async (date : any , employeeId : any) => {

//     const datePattern = new RegExp(`^\\d{2}/${date}$`);

//     let findEmployee = await USER.findById(employeeId)
//     if (!findEmployee) throw new Error('please provide valid employeeId.')

//     const trackerData = await TRACKER.find({
//         userId: employeeId,
//         date: { $regex: datePattern }
//     });

//     const monthlyData = [];

//     for (let day = 1; day <= 31; day++) {

//         const formattedDay = day < 10 ? '0' + day : '' + day;
//         const dateString = formattedDay + '/' + date;

//         const dayData = trackerData.filter(item => item.date === dateString);

//         if (dayData.length) {

//             let activeLoggedTime = 0;
//             let inactiveLoggedTime = 0;

//             for (const item of dayData) {

//                 let differentTime = await calculateTimeDifference(item.startTime, item.endTime);

//                 if (item.isActive) {
//                     activeLoggedTime += differentTime
//                 } else {
//                     inactiveLoggedTime += differentTime
//                 }
                
//             }

//             monthlyData.push({
//                 date: dateString,
//                 activeLoggedTime: formatTime(activeLoggedTime),
//                 inactiveLoggedTime: formatTime(inactiveLoggedTime),
//                 totalLoggedTime: formatTime(activeLoggedTime + inactiveLoggedTime)
//             });
//         }
//     }

//     return monthlyData
// }


// import { Request, Response } from 'express';
// import moment from 'moment';
// import { HOLIDAY, ROLE, USER, TRACKER } from '../models'; // Adjust the import based on your project structure

export const getAttendance = async (req: Request, res: Response) => {
    try {
        let { date } = req.query as any;

        if (!moment(date, "DD/MM/YYYY", true).isValid()) throw new Error('Please provide a valid date format.');

        let dateFormat = moment(date, "DD/MM/YYYY", true);
        let year = dateFormat.year();
        let month = dateFormat.month() + 1;

        const daysInMonth = getDaysInMonth(month, year);
        const countOfSunday = countSundaysInMonth(month, year);

        let dateFormatForMonthAndYear = moment(date, "DD/MM/YYYY", true).format('MM/YYYY');
        const regexForMonthAndYear = new RegExp(`^\\d{2}/${dateFormatForMonthAndYear}$`);

        let countOfHoliday = await HOLIDAY.countDocuments({
            date: {
                $regex: regexForMonthAndYear
            },
            isOnSunday: false
        });

        let workingDays = daysInMonth - (countOfSunday + countOfHoliday);

        let findRole: any = await ROLE.findOne({ name: 'employee' });
        let allUser = await USER.find({ role: findRole?._id, isDeleted: false });
        let userIds = allUser.map((user) => user?._id);

        const attendanceData = await TRACKER.aggregate([
            {
                $match: {
                    userId: { $in: userIds },
                    date: { $regex: regexForMonthAndYear }
                }
            },
            {
                $group: {
                    _id: {
                        userId: "$userId",
                        date: "$date"
                    },
                    activeLoggedTime: {
                        $sum: {
                            $cond: [
                                { $eq: ["$isActive", true] },
                                { $subtract: ["$endTime", "$startTime"] },
                                0
                            ]
                        }
                    },
                    inactiveLoggedTime: {
                        $sum: {
                            $cond: [
                                { $eq: ["$isActive", false] },
                                { $subtract: ["$endTime", "$startTime"] },
                                0
                            ]
                        }
                    }
                }
            },
            {
                $group: {
                    _id: "$_id.userId",
                    monthlyData: {
                        $push: {
                            date: "$_id.date",
                            activeLoggedTime: "$activeLoggedTime",
                            inactiveLoggedTime: "$inactiveLoggedTime",
                            totalLoggedTime: { $add: ["$activeLoggedTime", "$inactiveLoggedTime"] }
                        }
                    }
                }
            },
            {
                $lookup: {
                    from: 'profiles',
                    localField: '_id',
                    foreignField: 'userId',
                    as: 'profile'
                }
            },
            {
                $unwind: "$profile"
            },
            {
                $project: {
                    userId: "$_id",
                    monthlyData: 1,
                    profile: 1
                }
            }
        ]);

        let fiveHoursInMilliSecond : any = process.env.FIVE_HOURS_IN_MILLISECOND;
        let threeHoursInMilliSecond : any = process.env.THREE_HOURS_IN_MILLISECOND;

        let response = []

        for (const oneUserData of attendanceData) {

            let presentDay = 0;
            let absentDay = 0; 
            console.log('oneUserData.userId :>> ', oneUserData.userId);

            for (const dailyData of oneUserData.monthlyData) {
                if(parseInt(dailyData.totalLoggedTime) > parseInt(fiveHoursInMilliSecond)){
                    presentDay++;
                } else if(parseInt(dailyData.totalLoggedTime) > parseInt(threeHoursInMilliSecond)){
                    presentDay += 0.5;
                } else {
                    absentDay++;
                }
            }
            
            let approvedLeaveCount = 0;
            let unApprovedLeaveCount = 0;
            let unInformedLeaveCount = 0;

            let findAllLeaves = await LEAVE_REQUEST.find({ userId : oneUserData.profile.userId });

            let findAllApprovedLeave = findAllLeaves.filter((leave : any) => leave.status === 'Approved');
            // let findAllDeclinedLeave = findAllLeaves.filter((leave : any) => leave.status === 'Declined');
            
            let findOneDayLeaves : any = findAllApprovedLeave.filter((leave : any) => leave.leaveType === "oneDay");
            let findHalfDayLeaves : any = findAllApprovedLeave.filter((leave : any) => leave.leaveType === "halfDay");
            let findMultiDayLeaves = findAllApprovedLeave.filter((leave : any) => leave.leaveType === "multiDay");

            let multiDayCount :any = 0
            for (const multiDaySingleLeave of findMultiDayLeaves) {
                let startDate = moment(multiDaySingleLeave.dateFrom , "DD/MM/YYYY", true).format('MM/YYYY');
                let endDate = moment(multiDaySingleLeave.dateTo , "DD/MM/YYYY", true).format('MM/YYYY');
                multiDayCount = await calculateMultiDayLeaveDuration(startDate, endDate)
            }

            approvedLeaveCount = findOneDayLeaves.length + findHalfDayLeaves.length / 2 + multiDayCount;
            
            response.push({
                firstName : oneUserData.profile.firstName,
                lastName : oneUserData.profile.lastName,
                workingDays : workingDays,
                presentDay,
                absentDay,
                userId : oneUserData.profile.userId
            })

        }

        res.status(201).json({
            status: 201,
            message: 'Success',
            data: response
        });
    } catch (error: any) {
        res.status(400).json({
            status: 'Fail',
            message: error.message
        });
    }
}
