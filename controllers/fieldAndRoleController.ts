import FIELD from '../models/fieldModel';
import ROLE from '../models/roleModel';
import CHECK from '../models/checkModel'
import { Request, Response } from 'express';
import moment from 'moment-timezone';
import { main, extractLineNumber } from './emailController';

export const getFieldAndRole = async (req : Request, res : Response) => {

    try {
    
        const fieldArray = await FIELD.find({
            subscriptionId: req.subscriptionId
        })

        const roleArray = await ROLE.find({
            subscriptionId: req.subscriptionId , name : {$ne : "admin"}
        })

        let response = {
            fieldArray,
            roleArray
        }

        res.status(200).json({
            status: 200,
            message: "field create Successfully.",
            data: response
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

export const addFieldAndRole = async (req : Request, res : Response) => {
    try {

        const { name, type } = req.body;

        if (!name) {
            throw new Error('name is required.')
        } else if (!['role', 'field'].includes(type)) {
            throw new Error('Please provide a valid type: "role" or "field".');
        }

        if (type == 'field') {

            let field = await FIELD.findOne({ name: name })

            if (!field) {
                field = await FIELD.create({
                    name,
                })
            }

            return res.status(200).json({
                status: 200,
                message: "field create Successfully.",
                data: field
            });

        } else if (type == 'role') {

            let role = await ROLE.findOne({ name: name })

           

            if (!role) {
                role = await ROLE.create({
                    name,
                })
            }

            return res.status(200).json({
                status: 200,
                message: "role create Successfully.",
                data: role
            });
        }

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

export const check = async (req : Request, res : Response) => {
    try {

        let date = moment().tz('Asia/Kolkata').format('DD/MM/YYYY hh:mm:ss A');
        
        let check = await CHECK.create({
            apiCallTime : date,
            userId : req.userId
        })

        return res.status(200).json({
            status: 200,
            message: "data create Successfully.",
            data : check
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