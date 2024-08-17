import express from 'express'
import { isAuthenticated } from "../middlewares/isAuth";
import { createHoliday, deleteHoliday, getHoliday, updateHoliday } from '../controllers/holidayContorller'
const router = express.Router();
/* GET users listing. */
router.post('/create' , isAuthenticated , createHoliday);
router.get('/get' , isAuthenticated , getHoliday);
router.put('/update' , isAuthenticated , updateHoliday);
router.delete('/delete' , isAuthenticated , deleteHoliday)

export default router;
