import { Response, Request, NextFunction } from 'express';
import ADJUST_DAYS from "../models/adjustAttendanceModel";
import USER from '../models/userModel';

export const createAdjustAttendance = async (req: Request, res: Response, next: NextFunction) => {
    try {

        if (!req.body.userId || req.body.userId === null || req.body.userId === '') {
            throw new Error('Please provide a userId.');
        } else if (!req.body.month || req.body.month === null || req.body.month === '') {
            throw new Error('Please provide a month.');
        } else if (!req.body.year || req.body.year === null || req.body.year === '') {
            throw new Error('Please provide a year.');
        } else if (!req.body.adjustDay || req.body.adjustDay === null || req.body.adjustDay === '') {
            throw new Error('Please provide a adjustDay.');
        }

        let findUser = await USER.findOne({ _id : req.body.userId , isDeleted : false });
        if(!findUser) throw new Error('user not found')

        var adjustFind = await ADJUST_DAYS.findOne({ userId: req.body.userId, year: req.body.year, month: req.body.month, isDeleted: false });
        console.log(adjustFind);

        if (adjustFind) {
            var updatedData = await ADJUST_DAYS.findByIdAndUpdate(adjustFind._id, {
                adjustDay: req.body.adjustDay,
                updatedBy: req.userId
            }, { new: true })
            res.status(202).json({
                status: 202,
                message: 'AdjustDays update successfully.',
                data: updatedData
            })
        } else {
            var createData = await ADJUST_DAYS.create({
                userId: req.body.userId,
                month: req.body.month,
                year: req.body.year,
                adjustDay: req.body.adjustDay,
                createdBy: req.userId,
                updatedBy: null,
                isDeleted: false,
                deletedBy: null,
            });
            res.status(201).json({
                status: 201,
                message: 'AdjustDays create successfully.',
                data: createData
            })
        }

    } catch (error: any) {
        res.status(400).json({
            status: 'Fail',
            message: error.message
        })
    }
}