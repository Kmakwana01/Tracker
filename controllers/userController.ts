import USER from '../models/userModel';
import PROFILE from '../models/profileModel'; // Assuming PROFILE is a default export
import RESET from '../models/forgetPasswordModel'; // Assuming RESET is a default export
import TOKEN from '../models/tokenModel'; // Assuming TOKEN is a default export
import SESSION from '../models/sessionModel'; // Assuming SESSION is a default export
import bcrypt from 'bcrypt'; // Assuming bcrypt has type definitions installed
import jwt from 'jsonwebtoken'; // Assuming jwt has type definitions installed
import fs from 'fs';
import { OTPGenerator, SendEmail } from '../utils/handler'; // Assuming OTPGenerator and SendEmail are functions with type definitions
import { constants } from '../config'; // Assuming constants is an object with type definitions
import moment from 'moment'; // Assuming moment has type definitions installed
import SUBSCRIPTION from '../models/subscriptionModel'; // Assuming SUBSCRIPTION is a default export
import ROLE from '../models/roleModel'; // Assuming ROLE is a default export
import { Request, Response } from 'express';
import { main, extractLineNumber } from './emailController';
import path from 'path';
import { SUBSCRIPTION_WEBHOOK } from '../models/webhook';

const secretKeyPath = path.resolve(__dirname, '../jwtRS256.key');
const secretKey = fs.readFileSync(secretKeyPath, 'utf-8');

const options : jwt.SignOptions = {
    expiresIn: constants.ACCESS_TOKEN_EXPIRE_IN_DAY,
    algorithm: 'RS256'
};

export const SignUp = async (req : Request , res : Response) => {

    try {

        let { email, password, confirmPassword, roleId, subscriptionStartDate, subscriptionEndDate, price } = req.body

        if (!email) {
            throw new Error('email is required.')
        } else if (!password) {
            throw new Error('password is required.')
        } else if (!confirmPassword) {
            throw new Error('confirmPassword is required.')
        }  else if (!subscriptionStartDate) {
            throw new Error('subscriptionStartDate is required.')
        } else if (!subscriptionEndDate) {
            throw new Error('subscriptionEndDate is required.')
        } else if (!price) {
            throw new Error('price is required.')
        }

        if (!roleId) {
            let findAdmin = await ROLE.findOne({ name: "admin" })
            if (!findAdmin) {
                let newRole = await ROLE.create({
                    name: "admin"
                })
                roleId = newRole._id
            } else {
                roleId = findAdmin._id
            }
        }

        const formattedSubscriptionStartDate = moment(subscriptionStartDate, 'DD/MM/YYYY', true);
        const formattedSubscriptionEndDate = moment(subscriptionEndDate, 'DD/MM/YYYY', true);
        const durationInDays = formattedSubscriptionEndDate.diff(formattedSubscriptionStartDate, 'days');

        if (!formattedSubscriptionStartDate.isValid() || !formattedSubscriptionEndDate.isValid()) {
            throw new Error('Please provide valid dates in DD/MM/YYYY format.')
        }

        if (password !== confirmPassword) {
            throw new Error("Password and confirmPassword not matched.");
        }

        let findRole : any = await ROLE.findOne({ _id: roleId });

        if (!findRole) {
            throw new Error('please provide valid roleId.')
        } else if (findRole.name !== 'admin') {
            throw new Error('Access denied. admin role is required.');
        }

        if (req.body?.password) {
            password = await bcrypt.hash(password, 9)
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!emailRegex.test(email)) {
            throw new Error(
                "Invalid email format."
            );
        }

        const isMail = await USER.findOne({ email: email, isDeleted: false }, { email: 1, _id: 0 })

        if (isMail) throw new Error('Email already exists.')

        let newSubscription = await SUBSCRIPTION.create({
            subscriptionStartDate: formattedSubscriptionStartDate,
            subscriptionEndDate: formattedSubscriptionEndDate,
            price,
            durationInDays,
        })

        const newUser = await USER.create({
            email: email,
            password: password,
            isActive: true,
            role: roleId,
            createdBy: null,
            subscriptionId: newSubscription._id,
            isDeleted: false,
        })

        const newProfile = await PROFILE.create({
            userId: newUser._id,
            firstName: null,
            lastName: null,
            profileImage: null,
            deletedBy: null,
            isDeleted: false
        })

        let Profile = await PROFILE.findOne({ _id: newProfile._id }).populate({ path: "userId", populate: { path: "role" } }).populate('field')

        res.status(201).json({
            status: 201,
            message: "User create successfully.",
            data: Profile
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

export const Login = async (req : Request , res : Response) => {
    try {

        const { email, password, notificationToken, ipAddress, deviceName, platform, version, buildNumber, adminId } = req.body;

        if (!email) throw new Error('email is required.');
        if (!password) throw new Error('password is required.');
        // if (!deviceName) throw new Error('deviceName is required.');
        // if (!platform) throw new Error('platform is required.');
        // if (!version) throw new Error('version is required.');
        // if (!buildNumber) throw new Error('buildNumber is required.');

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!emailRegex.test(email)) {
            throw new Error(
                "Invalid email format."
            );
        }

        let query = { email: email, isDeleted: false };

        // if (adminId) {
        //     query.role = "employee";
        //     // query.createdBy = adminId;
        // } else {
        //     query.role = "admin";
        // }

        const User : any = await USER.findOne(query).populate('role')

        if (!User) {
            throw new Error('User Not Found');
        }

        // if (User.role !== 'admin' && !adminId) throw new Error('Admin ID is required for non-admin users.');

        const passwordMatch = await bcrypt.compare(password, User?.password)

        if (!passwordMatch) {
            throw new Error('password invalid');
        }

        const objectToCreateToken = {
            userId: User?._id,
            email: User?.email,
            role: User?.role?.name,
            subscriptionId: User?.subscriptionId,
            createdAt: Date.now(),
        };

        const accessToken = jwt.sign(objectToCreateToken, secretKey, options);
        const refreshToken = jwt.sign({ userId: User._id , subscriptionId : User?.subscriptionId }, secretKey, {
            expiresIn: constants.REFRESH_TOKEN_EXPIRE_IN_DAY,
            algorithm: 'RS256',
        });

        await TOKEN.create({
            accessToken: accessToken,
            refreshToken: refreshToken,
            userId: User._id,
            createdAt: Date.now()
        })

        await SESSION.create({
            notificationToken,
            jwtToken: accessToken,
            userAgent: req.get("User-Agent"),
            ipAddress: req.ip || ipAddress,
            deviceName: deviceName ? deviceName : null,
            platform: platform ? platform : null,
            userId: User._id,
            version,
            buildNumber: buildNumber ? buildNumber : null,
            isActive: true,
            generatedAt: new Date(),
        });

        res.status(201).json({
            status: 201,
            message: "User Login Successfully.",
            token: accessToken,
            refreshToken,
            userId: User._id,
            role: User.role
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

export const forgetPassword = async (req : Request , res : Response) => {
    try {

        const { email, password, adminId } = req.body

        if (!email) {
            throw new Error('email is required')
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!emailRegex.test(email)) {
            throw new Error(
                "Invalid email format."
            );
        }

        let query = { email: email, isDeleted: false };

        // if (adminId) {
        //     query.role = "employee";
        //     query.createdBy = adminId;
        // } else {
        //     query.role = "admin";
        // }

        const User = await USER.findOne(query);

        if (!User) {
            throw new Error('User Not Found');
        }

        await RESET.deleteMany({ email: User.email });
        const otp : any = OTPGenerator()

        await RESET.create({
            verificationCode: otp,
            email: User?.email
        })

        await SendEmail(User?.email, `Forget Password `, `OTP : ${otp}`).catch(err => console.log(err));

        res.status(200).json({
            status: 200,
            message: 'Verification code sent successfully'
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

export const compareCode = async (req : Request , res : Response) => {
    try {

        const { email, verificationCode } = req.body

        if (!email) {
            throw new Error('email is required')
        }
        if (!verificationCode) {
            throw new Error('verificationCode is required')
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!emailRegex.test(email)) {
            throw new Error(
                "Invalid email format."
            );
        }

        const User = await USER.findOne({ email })

        if (!User) {
            throw new Error('User Not Found');
        }

        const reset = await RESET.findOne({
            verificationCode: verificationCode,
            email: email,
        });

        if (!reset) {
            throw new Error("Invalid verification code.");
        }

        res.status(200).json({
            status: 200,
            message: "Your verification code is accepted.",
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

export const resetPassword = async function (req : Request , res : Response) {
    try {
        // let password = req.body.password;
        let { email, password, confirmPassword } = req.body

        if (!email) {
            throw new Error('email is required')
        } else if (!password) {
            throw new Error('password is required')
        } else if (!confirmPassword) {
            throw new Error('confirmPassword is required')
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!emailRegex.test(email)) {
            throw new Error(
                "Invalid email format."
            );
        }

        if (password !== confirmPassword) {
            throw new Error("Password is not matched with confirmation password.");
        }

        const User : any = await USER.findOne({ email });

        if(!User) throw new Error('User Not Found.');

        const oldAndNewPasswordIsSame = await bcrypt.compare(password, User.password)

        if (oldAndNewPasswordIsSame) {
            throw new Error('New Password Matches Old Password. Please choose a different password for security purposes.')
        }

        password = await bcrypt.hash(password, 10);

        req.body.confirmPassword = undefined;
        User.password = password;
        User.save();

        res.status(200).json({
            status: 200,
            message: "Your password has been reset.",
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
};

export const logOut = async function (req : Request , res : Response) {
    try {
        // console.log('object',req.headers.authentication);
        // const token = req.headers["authorization"] || req.headers["authentication"] || req.body.token || req.query.token || req.headers["token"];

        // const tokenArray = token.split(" ");

        // if (!(tokenArray.length > 1)) {
        //     res.status(401).json({
        //         token: tokenArray,
        //         tokenLength: tokenArray.length,
        //         message : "Invalid Token 1",
        //         header: req.headers
        //     });
        // }

        // const authentication = tokenArray[1]

        const authentication = req.token

        if (!authentication) {
            throw new Error("Authorization token is missing.");
        }
        // console.log(token);

        const session = { jwtToken: authentication };

        await SESSION.updateOne(session, {
            isActive: false,
        });

        res.status(200).json({
            status: 200,
            message: "User Logout Successfully.",
            // accessToken: authentication,
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
};

export const token = async (req : Request , res : Response) => {
    try {

        const refreshToken = req.body.refreshToken;

        if (!refreshToken) {
            throw new Error('Please provide a refresh token.');
        }

        const token = await TOKEN.findOne({ refreshToken });

        if (!token) {
            throw new Error('Invalid refresh token.');
        }
        // Verify the refresh token

        const decodedToken : any = jwt.decode(refreshToken);

        if(!decodedToken){
            throw new Error('invalid token.');
        }

        // const FIND_SUBSCRIPTION = await SUBSCRIPTION.findById(decodedToken.subscriptionId);

        // if (!FIND_SUBSCRIPTION) {
        //     throw new Error('Subscription not found');
        // }

        // const subscriptionEndDate = moment(FIND_SUBSCRIPTION.subscriptionEndDate);
        // const currentDate = moment();
        // const isExpired = currentDate.isAfter(subscriptionEndDate);

        // if (isExpired) {
        //     throw new Error('The subscription has expired.');
        // }
        // console.log(decodedToken);
        // Check if decoded token is valid

        const tokenExpiration = new Date(decodedToken.exp * 1000);
        const currentTime = new Date();

        if (tokenExpiration <= currentTime) {
            throw new Error('Refresh token has expired.');
        }

        const session = await SESSION.findOne({ userId: token.userId, jwtToken: token.accessToken, isActive: true });

        if (!session) {
            throw new Error('User session not found.');
        }

        // Find user
        const user : any = await USER.findOne({ _id: session.userId, isDeleted : false }).populate('role')

        if (!user) {
            throw new Error('User not found.');
        }

        const accessToken = jwt.sign({

            email: user.email,
            userId: user._id,
            role: user?.role?.name,
            subscriptionId: user?.subscriptionId,
            createdAt: Date.now()

        }, secretKey, options);

        await SESSION.findByIdAndUpdate(session._id, { $set: { jwtToken: accessToken } }, { new: true });
        await TOKEN.findByIdAndUpdate(token._id, { $set: { accessToken: accessToken } }, { new: true });

        res.status(201).json({
            status: 201,
            message: 'Token updated successfully.',
            accessToken: accessToken
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

export const appleV2Webhook = async (req : Request , res : Response) => {
    try {
  
      if(!req.body) throw new Error('please provide valid content.')
  
      let newWebhookResponse = await SUBSCRIPTION_WEBHOOK.create({
        response : req.body
      })
      
      res.status(200).json({
        message : "TransactionInfo Get Successfully.",
        data : newWebhookResponse
      })
  
    } catch (error : any) {
  
      res.status(400).json({
        status: "Failed",
        message: error.message,
    });
    }
  }

export const appleV2WebhookGet = async (req : Request , res : Response) => {
    try {
  
      let newWebhookResponse = await SUBSCRIPTION_WEBHOOK.find()
      
      res.status(200).json({
        message : "TransactionInfo Get Successfully.",
        data : newWebhookResponse
      })
  
    } catch (error : any) {
  
      res.status(400).json({
        status: "Failed",
        message: error.message,
    });
    }
  }

export const sendEmailForError = async (req : Request , res : Response) => {
    try {

        const { email , text , subject } = req.body;

        if(!email) throw new Error('email is required.');
        if(!text) throw new Error('text is required.');
        if(!subject) throw new Error('subject is required.');

        await SendEmail(email , subject , text)

        res.status(200).json({
            message : "email Sent Successfully.",
        });
        
    } catch (error : any) {
        res.status(400).json({
          status: "Failed",
          message: error.message,
        });
    }
}