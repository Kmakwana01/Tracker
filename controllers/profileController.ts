import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import moment from 'moment';
import USER from '../models/userModel';
import PROFILE from '../models/profileModel';
import { getEmployeeDuration } from '../utils/handler';
import { main, extractLineNumber } from './emailController';

export const getProfile = async (req : Request , res : Response ) => {
    try {

        const { id } = req.params;

        if (!id) {
            throw new Error('please provide id.')
        }

        if (req.role === 'admin') {

            const userFind = await USER.findOne({ _id: id, isDeleted: false });
            if (!userFind) {
                throw new Error('User not found.')
            }


            let findProfile : any = await PROFILE.findOne({ userId: userFind._id, isDeleted: false }).populate({ path: "userId", populate: { path: "role" } }).populate('field')
            const url = findProfile?.profileImage ? `${req.protocol}://${req.get('host')}/images/${findProfile?.profileImage}` : null;
            const formattedBirthDate = moment(findProfile.birthDate).format('DD/MM/YYYY');
            const formattedJoinDate = moment(findProfile.joinDate).format('DD/MM/YYYY');

            let response = {
                ...findProfile._doc,
                profileImage: url ? url : null,
                birthDate: formattedBirthDate,
                joinDate: formattedJoinDate
            }

            res.status(200).json({
                status: 200,
                message: 'Your profile has been get successfully.',
                data: response
            })

        } else {

            const userFind : any = await USER.findOne({ _id: id, isDeleted: false });

            if (!userFind) {
                throw new Error('User not found.');
            }

            let findProfile : any = await PROFILE.findOne({ userId: userFind._id, isDeleted: false }).populate({ path: "userId", populate: { path: "role" } }).populate('field')
            const joinDate = moment(findProfile.joinDate);
            const employeeDuration = getEmployeeDuration(joinDate);
            const formattedJoinDate = moment(findProfile.joinDate).format('DD/MM/YYYY');
            const url = findProfile?.profileImage ? `${req.protocol}://${req.get('host')}/images/${findProfile?.profileImage}` : null;
            const formattedBirthDate = moment(findProfile.birthDate).format('DD/MM/YYYY');

            let response = {
                ...findProfile._doc,
                profileImage: url ? url : null,
                birthDate: formattedBirthDate,
                employeeDuration,
                formattedJoinDate
            }

            res.status(200).json({
                status: 200,
                message: 'Your profile has been get successfully.',
                data: response
            })
        }

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

export const updateProfile = async (req : Request , res : Response) => {
    try {

        const { firstName, lastName, email, birthDate ,mobileNumber  } = req.body;
        const { id } = req.params;
        if (!id) {
            throw new Error('please provide id.')
        }

        if (!firstName) {
            throw new Error('Please provide a firstName.');
        } else if (!lastName) {
            throw new Error('Please provide a lastName.');
        } else if (!email) {
            throw new Error('Please provide a email.');
        } else if (!birthDate) {
            throw new Error('Please provide a birth date.');
        }

        const formattedBirthDate : any = moment(birthDate, 'DD/MM/YYYY', true);

        if (!formattedBirthDate.isValid()) {
            throw new Error('Please provide valid dates in DD/MM/YYYY format.')
        }

        const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;
        if (!emailRegex.test(email)) {
            throw new Error('Please provide a valid email address.');
        }

        const emailFind = await USER.findOne({ email: email, isDeleted: false });

        if (emailFind && emailFind._id.toString() !== req.userId) {
            throw new Error('This email already exists.');
        }

        const profile : any = await PROFILE.findOne({ userId: id });
        const userFind : any= await USER.findOne({ _id: profile.userId });

        let newProfileImage = req.files?.filter((file : any) => file?.fieldname === 'profileImage')[0];
        let profileImage;

        if (newProfileImage) {

            profileImage = newProfileImage?.filename

        } else {

            profileImage = profile.profileImage;

        }

        const updateProfile : any = await PROFILE.findByIdAndUpdate(profile._id, {

            firstName,
            lastName,
            profileImage,
            birthDate: formattedBirthDate.toDate('DD/MM/YYYY'),
            mobileNumber : mobileNumber ? mobileNumber : profile.mobileNumber

        }, { new: true });

        const userUpdate : any = await USER.findByIdAndUpdate(userFind._id, {

            email

        }, { new: true });


        let findProfile : any = await PROFILE.findOne({ _id: updateProfile._id, isDeleted: false }).populate({ path: "userId", populate: { path: "role" } }).populate('field')
        const url = findProfile?.profileImage ? `${req.protocol}://${req.get('host')}/images/${findProfile?.profileImage}` : null;

        let response = {
            ...findProfile._doc,
            profileImage: url ? url : null,
        }

        res.status(202).json({
            status: 202,
            message: 'Profile updated successfully.',
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
}

export const updatePassword = async (req : Request , res : Response) => {
    try {

        let { currentPassword, newPassword, confirmNewPassword } = req.body

        let { id } = req.params

        if(!id){
            throw new Error('please provide id.')
        }

        if (!currentPassword) {
            throw new Error('Please provide currentPassword.');
        } else if (!newPassword) {
            throw new Error('Please provide newPassword.');
        } else if (!confirmNewPassword) {
            throw new Error('Please provide confirmNewPassword.');
        }

        const userFind = await USER.findOne({ _id: id });

        if (!userFind) {
            throw new Error('This user does not exist.');
        }

        const passwordCheck = await bcrypt.compare(currentPassword, userFind.password);
        if (!passwordCheck) {
            throw new Error('Please provide a valid currentPassword.');
        }

        if (currentPassword === newPassword) {
            throw new Error('New password cannot be the same as the current password.');
        }

        // const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
        // if (!passwordRegex.test(password)) {
        //     throw new Error('Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, and one digit.');
        // }

        if (newPassword !== confirmNewPassword) {
            throw new Error('password and confirmPassword must be the same.');
        }

        const hashPassword = await bcrypt.hash(newPassword, 10)
        userFind.password = hashPassword;
        await userFind.save();

        res.status(202).json({
            status: 202,
            message: 'Your password has been updated.',
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