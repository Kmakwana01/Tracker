import express from 'express'
import { isAuthenticated } from "../middlewares/isAuth";
import { getAttendance } from '../controllers/attendanceController';
const router = express.Router();
/* GET users listing. */

router.get('/getAttendance', isAuthenticated, getAttendance)

export default router;
