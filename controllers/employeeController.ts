import PROFILE from '../models/profileModel';
import ROLE from '../models/roleModel';
import FIELD from '../models/fieldModel';
import USER from '../models/userModel';
import moment from 'moment';
import bcrypt from 'bcrypt';
import { getEmployeeDuration } from '../utils/handler';
import { Request, Response } from 'express';
import { main, extractLineNumber } from './emailController';

export const createEmployee = async (req : Request , res : Response) => {

    try {

        let { firstName, lastName, password, mobileNumber, birthDate, joinDate, email, roleId, fieldId } = req.body;

        if (!firstName) {
            throw new Error('firstName is required.')
        } else if (!lastName) {
            throw new Error('lastName is required.')
        } else if (!password) {
            throw new Error('password is required.')
        } else if (!joinDate) {
            throw new Error('joinDate is required.')
        } else if (!email) {
            throw new Error('email is required.')
        } else if (!roleId) {
            throw new Error('roleId is required.')
        } else if (!fieldId) {
            throw new Error('fieldId is required.')
        }

        if (req.role === 'admin') {

            let formattedBirthDate : any;
            if (birthDate) {
                formattedBirthDate = moment(birthDate, 'DD/MM/YYYY', true);
                if (!formattedBirthDate.isValid()) {
                    throw new Error('Please provide valid dates in DD/MM/YYYY format.')
                }
            }

            let formattedJoinDate : any = moment(joinDate, 'DD/MM/YYYY', true);

            if (!formattedJoinDate.isValid()) {
                throw new Error('Please provide valid dates in DD/MM/YYYY format.')
            }

            const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;
            if (!emailRegex.test(email)) {
                throw new Error('Please provide a valid email address.');
            }

            let findRole = await ROLE.findOne({ _id: roleId })
            let findField = await FIELD.findOne({ _id: fieldId })

            if (!findRole) throw new Error('please provide valid roleId.')
            if (!findField) throw new Error('please provide valid fieldId.')

            let isMail = await USER.findOne({ email: email, isDeleted: false })
            if (isMail) throw new Error('This email user already exists.');

            // const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
            // if (!passwordRegex.test(password)) {
            //     throw new Error('Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, and one digit.');
            // }

            if (password) {
                password = await bcrypt.hash(password, 10)
            }

            var newUser = await USER.create({
                email,
                password,
                role: roleId,
                deletedBy: null,
                isDeleted: false,
                subscriptionId: req.subscriptionId,
                createdBy: req.userId
            })

            var newProfile = await PROFILE.create({
                userId: newUser._id,
                firstName: firstName ? firstName : null,
                lastName: lastName ? lastName : null,
                mobileNumber: mobileNumber ? mobileNumber : null,
                profileImage: null,
                birthDate: formattedBirthDate.toDate('DD/MM/YYYY'),
                joinDate: formattedJoinDate.toDate('DD/MM/YYYY'),
                field: fieldId,
                deletedBy: null,
                isDeleted: false
            })

        } else {
            throw new Error('This API is accessible only for users with admin role.');
        }

        const employeeJoinDate = moment(newProfile.joinDate);
        const employeeBirthDate = moment(newProfile.birthDate);
        const formattedJoinDate = employeeJoinDate.format('DD/MM/YYYY');
        const formattedBirthDate = employeeBirthDate.format('DD/MM/YYYY');
        let findProfile : any = await PROFILE.findOne({ _id: newProfile._id, isDeleted: false }).populate({ path: "userId", populate: { path: "role" } }).populate('field')
        let response : any = {
            ...findProfile._doc,
            birthDate: formattedBirthDate,
            joinDate: formattedJoinDate
        }

        res.status(200).json({
            status: 201,
            message: 'employee created successfully',
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

export const getAllEmployees = async (req : Request , res : Response) => {
    try {

        let response = [];

        if (req.role === 'admin') {
            // console.log({ isDeleted: false, subscriptionId: req.subscriptionId, createdBy: req.userId })
            let allUsers : any = await USER.find({ isDeleted: false, subscriptionId: req.subscriptionId, createdBy: req.userId }).populate('role')

            for (const user of allUsers) {

                if (user.role.name === 'employee') {

                    let profile : any = await PROFILE.findOne({ userId: user._id, isDeleted: false }).populate({ path: "userId", populate: { path: "role" } }).populate('field')

                    if(profile){

                        const joinDate = moment(profile.joinDate, 'DD/MM/YYYY');
                        const birthDate = moment(profile.birthDate, 'DD/MM/YYYY');
                        const formattedJoinDate = joinDate.format('DD/MM/YYYY');
                        const formattedBirthDate = birthDate.format('DD/MM/YYYY');
                        const employeeDuration = getEmployeeDuration(joinDate);
                        
                        response.push({
                            ...profile._doc,
                            birthDate: formattedBirthDate,
                            joinDate: formattedJoinDate,
                            timeDuration: employeeDuration,
                            profileImage: profile.profileImage ? `${req.protocol}://${req.get('host')}/images/${profile.profileImage}` : null
                        })
                    }
                }
            }

        } else {
            throw new Error('This API is accessible only for users with admin role.');
        }

        res.status(200).json({
            status: 201,
            message: 'employee get successfully',
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

export const updateEmployee = async (req : Request , res : Response) => {
    try {

        let { firstName, lastName, password, mobileNumber, birthDate, joinDate, email } = req.body;

        if (!firstName) {
            throw new Error('firstName is required.')
        } else if (!lastName) {
            throw new Error('lastName is required.')
        } else if (!joinDate) {
            throw new Error('joinDate is required.')
        } else if (!email) {
            throw new Error('email is required.')
        }

        if (req.role === 'admin') {

            let employeeFind : any = await USER.findOne({ _id: req.params?.id })
            let employeeProfileFind : any = await PROFILE.findOne({ userId: employeeFind._id })

            if (!employeeFind) {
                throw new Error('This user does not exist.');
            } else if (employeeFind?.isDeleted === true) {
                throw new Error('This user has already been deleted.')
            }

            const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;
            if (!emailRegex.test(email)) {
                throw new Error('Please provide a valid email address.');
            }

            const emailFind = await USER.findOne({ email: email, isDeleted: false });

            if (emailFind && emailFind._id.toString() !== req.params.id) {
                throw new Error('This email user already exists.');
            }

            if (password) {
                password = await bcrypt.hash(password, 10)
            }

            let formattedBirthDate : any;
            if (birthDate) {
                formattedBirthDate = moment(birthDate, 'DD/MM/YYYY', true);
                if (!formattedBirthDate.isValid()) {
                    throw new Error('Please provide valid dates in DD/MM/YYYY format.')
                }
            }

            let formattedJoinDate : any = moment(joinDate, 'DD/MM/YYYY', true);

            if (!formattedJoinDate.isValid()) {
                throw new Error('Please provide valid dates in DD/MM/YYYY format.')
            }


            // const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
            // if (!passwordRegex.test(password)) {
            //     throw new Error('Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, and one digit.');
            // }

            var updateUser : any = await USER.findByIdAndUpdate(employeeFind._id, {
                email: email,
                password: password ? password : employeeFind.password,
            }, { new: true });

            var updateProfile : any = await PROFILE.findOneAndUpdate({ userId: updateUser._id }, {
                firstName: firstName ? firstName : employeeProfileFind.firstName,
                lastName: lastName ? lastName : employeeProfileFind.lastName,
                mobileNumber: mobileNumber ? mobileNumber : employeeProfileFind.mobileNumber,
                birthDate: formattedBirthDate ? formattedBirthDate : null,
                joinDate: formattedJoinDate,
            }, { new: true });

        } else {
            throw new Error('This API is accessible only for users with admin role.');
        }

        const employeeJoinDate = moment(updateProfile.joinDate);
        const employeeBirthDate = moment(updateProfile.birthDate);
        const formattedJoinDate = employeeJoinDate.format('DD/MM/YYYY');
        const formattedBirthDate = employeeBirthDate.format('DD/MM/YYYY');

        let findProfile : any = await PROFILE.findOne({ _id: updateProfile._id, isDeleted: false }).populate({ path: "userId", populate: { path: "role" } }).populate('field')

        let response = {
            ...findProfile._doc,
            birthDate: formattedBirthDate,
            joinDate: formattedJoinDate,
            profileImage: findProfile.profileImage ? `${req.protocol}://${req.get('host')}/images/${findProfile.profileImage}` : null
        }

        res.status(200).json({
            status: 201,
            message: 'employee updated successfully',
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

export const deleteEmployee = async (req : Request , res : Response) => {
    try {

        if (req.role === 'admin') {

            const user = await USER.findOne({ _id: req.params.id });

            if (!user) {
                throw new Error('This user does not exist.');
            } else if (user.isDeleted === true) {
                throw new Error('This user has already been deleted.')
            }

            await PROFILE.findOneAndUpdate(
                { userId: user._id }, {
                isDeleted: true,
                deletedBy: req.userId
            }, { new: true })

            await USER.findByIdAndUpdate(user._id, {
                isDeleted: true,
                deletedBy: req.userId
            }, { new: true })

        } else {
            throw new Error('This API is accessible only for users with admin role.');
        }

        res.status(202).json({
            status: 202,
            message: 'Employee deleted successfully.'
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
}
