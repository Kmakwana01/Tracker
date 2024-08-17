
import nodemailer from 'nodemailer'
import { constants } from '../config'
import moment from 'moment';

export const OTPGenerator = () => {
    let otpCode = Math.floor(900000 * Math.random() + 100000);
    return otpCode
}

export const SendEmail = async (to: any, subject: any, text: any, html?: any) => {
    try {
        // console.log(to);
        const transporter = nodemailer.createTransport({
            host: 'smtp.gmail.com', // Your SMTP server hostname
            port: 587, // Your SMTP port
            secure: false, // true for 465, false for other ports
            auth: {
                user: "testkmsof@gmail.com", // generated ethereal user
                pass: constants.NODEMAILER_PASSKEY, // generated ethereal password
            },
        });

        // Send mail with defined transport object
        let info = await transporter.sendMail({
            from: 'testkmsof@gmail.com', // sender address
            to, // list of receivers
            subject, // Subject line
            text: text, // plain text body
            html: html // html body
        });

        console.log('Message sent: %s', info.messageId);
        return true; // Email sent successfully
    } catch (error) {
        console.error('Error occurred while sending email:', error);
        return false; // Failed to send email
    }
}

export const getEmployeeDuration = function (joinDate: any) {

    const currentDate = moment();
    const duration = moment.duration(currentDate.diff(joinDate));

    const years = duration.years();
    const months = duration.months();
    const days = duration.days();

    let result = '';
    if (years > 0) {
        result += `${years} ${years === 1 ? 'year' : 'years'}`;
    }
    if (months > 0) {
        result += `${result.length > 0 ? ', ' : ''}${months} ${months === 1 ? 'month' : 'months'}`;
    }
    if (days > 0) {
        result += `${result.length > 0 ? ', ' : ''}${days} ${days === 1 ? 'day' : 'days'}`;
    }
    return result.length > 0 ? result : '0 days';
}

export const formatFileSize = async (bytes: any) => {

    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    if (bytes === 0) return '0 Byte';
    const i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)).toString());
    return Math.round((bytes / Math.pow(1024, i)) * 100) / 100 + ' ' + sizes[i];

};

export const calculateTimeDifference = async (startTime: any, endTime: any) => {
    const startMilliSecond = startTime.getTime();
    const endMilliSecond = endTime.getTime();
    // console.log('sss',startMilliSecond)
    // console.log('eee',endMilliSecond)
    // console.log('timeDiff',endMilliSecond - startMilliSecond)
    return endMilliSecond - startMilliSecond;
}

export const isBoolean = (value: any) => {
    return typeof value === 'boolean';
}

export const formatTime = (durationInMilliseconds: any) => {

    function padZero(num: any) {
        return num < 10 ? '0' + num : num;
    }

    let totalSeconds = durationInMilliseconds / 1000;
    let hours = Math.floor(totalSeconds / 3600);
    let minutes = Math.floor((totalSeconds % 3600) / 60);
    let seconds = Math.floor(totalSeconds % 60);
    let formattedTime = `${padZero(hours)}:${padZero(minutes)}:${padZero(seconds)}`;

    return formattedTime;
}

// function getDaysInMonth(month :any, year :any) {
//     return new Date(year, month, 0).getDate();
// }

// export function getFutureMonthDays(monthsAhead :any) {
//     const today = new Date();
//     const futureMonth = today.getMonth() + monthsAhead;
//     const futureYear = today.getFullYear() + Math.floor(futureMonth / 12);

//     // Adjust the futureMonth to be in the range 0-11
//     const adjustedMonth = futureMonth % 12 + 1;

//     return getDaysInMonth(adjustedMonth, futureYear);
// }

export function getDaysInMonth(month: number, year: number): number {
    return new Date(year, month, 0).getDate();
}

export function countSundaysInMonth(month: number, year: number): number {
    let sundayCount = 0;
    let date = new Date(year, month - 1, 1);
    while (date.getMonth() === month - 1) {
        if (date.getDay() === 0) {
            sundayCount++;
        }
        date.setDate(date.getDate() + 1);
    }
    return sundayCount;
}

export const millisecondsToTimeString = (milliseconds: number): string => {
    // Convert milliseconds to total seconds
    const totalSeconds = Math.floor(milliseconds / 1000);

    // Extract hours, minutes, and seconds
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    // Format with leading zeros if necessary
    const formattedHours = String(hours).padStart(2, '0');
    const formattedMinutes = String(minutes).padStart(2, '0');
    const formattedSeconds = String(seconds).padStart(2, '0');

    return `${formattedHours}:${formattedMinutes}:${formattedSeconds}`;
}


export async function calculateMultiDayLeaveDuration(startDate: any,endDate : any ) {

    let totalLeaveCount = 0;
    let currentDate = moment(startDate);

    while (currentDate.isSameOrBefore(endDate)) {
        if (currentDate.day() !== 0) {
            totalLeaveCount += 1;
        }
        currentDate.add(1, 'day');
    }

    return totalLeaveCount;
}