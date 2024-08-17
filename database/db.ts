import mongoose from "mongoose";
import { constants } from '../config'

export const mongodbConnection = async () => {
    try {
        mongoose.connect(constants.MONGO_URL)
            .then(() => console.log('mongoDB Connected!'))
            .catch(() => console.log('mongoDB connection Error'))
            
    } catch (error : any) {
        console.log('mongodbConnection Error')
    }
}