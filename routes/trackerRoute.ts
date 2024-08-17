import express from 'express'
import { isAuthenticated } from "../middlewares/isAuth";
import { upload } from '../utils/multer';
import { trackerCreate, trackerFileUpload, getMonthlyData, getDailyData } from '../controllers/trackerController';

const router = express.Router();

router.post('/trackerFileUpload' , isAuthenticated , upload.any() , trackerFileUpload);
router.post('/createTracker' , isAuthenticated , upload.any() , trackerCreate);
router.get('/getMonthlyData' , isAuthenticated , getMonthlyData);
router.get('/getDailyData' , isAuthenticated , getDailyData);

export default router;
