import { Request, Response, NextFunction } from 'express';
import HOLIDAY from '../models/holidayModel';
import moment from 'moment';

export const createHoliday = async (req: Request, res: Response, next: NextFunction) => {
    try {
        if (req.role === 'admin') {
            if (!req.body.name || (req.body.name && req.body.name === null) || req.body.name === '') {
                throw new Error('Please provide a name');
            } else if (!req.body.date || (req.body.date && req.body.date === null) || req.body.date === '') {
                throw new Error('Please provide a date.');
            }

            const requestedDate = moment(req.body.date, 'DD/MM/YYYY');
            if (!requestedDate.isValid()) {
                throw new Error('Invalid date format.');
            }

            const isOnSunday = (requestedDate.day() === 0) ? true : false;

            var holidayFind = await HOLIDAY.findOne({ date: req.body.date, isDeleted: false });
            if (holidayFind) {
                throw new Error('This day holiday already exists.');
            }

            var holiday = await HOLIDAY.create({
                name: req.body.name,
                date: req.body.date,
                addedBy: req.userId,
                isOnSunday: isOnSunday,
                isDeleted: false,
                deletedBy: null,
            })
            res.status(201).json({
                status: 201,
                message: 'Holiday created successfully.',
                data: holiday
            })
        } else {
            throw new Error('This API is accessible only for users with admin role.');
        }

    } catch (error: any) {
        res.status(400).json({
            status: 'Fail',
            message: error.message
        })
    }
};

export const getHoliday = async (req: Request, res: Response, next: NextFunction) => {
    try {

        const currentYear = new Date().getFullYear();
        const requestedMonth = req.query.month;
        const requestedYear = req.query.year;

        var holiday = await HOLIDAY.find({ isDeleted: false }).sort({ date: 1 })

        var holidayDate;

        if (requestedMonth && requestedYear) {

            const formattedMonth = requestedMonth.toString().padStart(2, '0');

            holidayDate = holiday.filter((holiday) => {
                const holidayMoment = moment(holiday.date, 'DD/MM/YYYY');
                const holidayYear = holidayMoment.year().toString();
                const holidayMonth = (holidayMoment.month() + 1).toString().padStart(2, '0');

                return holidayYear.toString() === requestedYear.toString() && holidayMonth === formattedMonth;
            }).map((holiday) => {
                return {
                    _id: holiday._id,
                    name: holiday.name,
                    date: holiday.date,
                    isOnSunday: holiday.isOnSunday
                };
            });

        } else if (requestedYear) {
            holidayDate = holiday
                .filter((holiday) => {
                    const holidayMoment = moment(holiday.date, 'DD/MM/YYYY');
                    const holidayYear = holidayMoment.year();

                    return holidayYear.toString() === requestedYear;
                })
                .map((holiday) => {
                    return {
                        _id: holiday._id,
                        name: holiday.name,
                        date: holiday.date,
                        isOnSunday: holiday.isOnSunday
                    };
                });
        } else {
            holidayDate = holiday
                .filter((holiday) => {
                    const holidayYear = moment(holiday.date, 'DD/MM/YYYY').year();

                    return holidayYear === currentYear;
                })
                .map((holiday) => {
                    return {
                        _id: holiday._id,
                        name: holiday.name,
                        date: holiday.date,
                        isOnSunday: holiday.isOnSunday,
                    };
                });
        }
        console.log("holidayDate : ", holidayDate);

        if (!holidayDate || holidayDate.length === 0) {
            res.status(200).json({
                status: 200,
                message: 'Holiday empty.',
                data: []
            })
        } else {
            res.status(200).json({
                status: 200,
                message: 'Holiday get was successfully.',
                data: holidayDate
            })
        }
    } catch (error: any) {
        res.status(400).json({
            status: 'Fail',
            message: error.message
        })
    }
};

export const updateHoliday = async (req: Request, res: Response, next: NextFunction) => {
    try {
        if (req.role === 'admin') {
            if (!req.body.name || (req.body.name && req.body.name === null) || req.body.name === '') {
                throw new Error('Please provide a name');
            } else if (!req.body.date || (req.body.date && req.body.date === null) || req.body.date === '') {
                throw new Error('Please provide a date.');
            } else if (!req.query.id || (req.query.id && req.query.id === null) || req.query.id === '') {
                throw new Error('Please provide an id.');
            }

            var holidayId = await HOLIDAY.findById(req.query.id);
            if (!holidayId) {
                throw new Error('This holiday does not exists.');
            }

            const requestedDate = moment(req.body.date, 'DD/MM/YYYY');
            if (!requestedDate.isValid()) {
                throw new Error('Invalid date format.');
            }

            const isOnSunday = (requestedDate.day() === 0) ? true : false;

            var holidayFind = await HOLIDAY.findOne({ date: req.body.date, isDeleted: false });
            if (holidayFind && holidayFind._id.toString() !== req.query.id) {
                throw new Error('This day holiday already exists.');
            }

            var holiday = await HOLIDAY.findByIdAndUpdate(holidayId._id, {
                name: req.body.name,
                date: req.body.date,
                addedBy: req.userId,
                isOnSunday: isOnSunday,
                isDeleted: false,
                deletedBy: null,
            }, { new: true })

            res.status(202).json({
                status: 202,
                message: 'Holiday updated successfully.',
                data: holiday
            })
        } else {
            throw new Error('This API is accessible only for users with admin role.');
        }

    } catch (error: any) {
        res.status(400).json({
            status: 'Fail',
            message: error.message
        })
    }
};

export const deleteHoliday = async (req: Request, res: Response, next: NextFunction) => {
    try {

        if (req.role === 'admin') {

            if (!req.query.id || (req.query.id && req.query.id === null) || req.query.id === '') {
                throw new Error('Please provide an id');
            }

            var holidayId = await HOLIDAY.findById(req.query.id);
            if (!holidayId) {
                throw new Error('This holiday does not exists.');
            }

            var holiday = await HOLIDAY.findByIdAndUpdate(holidayId._id, {
                isDeleted: true,
                deletedBy: req.userId
            }, { new: true })

            res.status(202).json({
                status: 202,
                message: 'Holiday deleted successfully.',
                data: holiday
            })
        } else {
            throw new Error('This API is accessible only for users with admin role.');
        }
    } catch (error: any) {
        res.status(400).json({
            status: 'Fail',
            message: error.message
        })
    }
};