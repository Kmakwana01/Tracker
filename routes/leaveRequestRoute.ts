
import express from 'express'
import { addRequest ,deleteLeaveRequest,getLeaveRequest ,getLeaveRequestById,statusChange ,updateRequest ,getLeaveRequestByStatus } from '../controllers/leaveRequestController';
import { isAuthenticated } from '../middlewares/isAuth';

const router = express.Router();

router.post('/create', isAuthenticated ,  addRequest);
router.get('/getLeaveRequest', isAuthenticated ,  getLeaveRequest);
router.get('/getLeaveRequestById', isAuthenticated ,  getLeaveRequestById);
router.put('/updateRequest', isAuthenticated ,  updateRequest);
router.post('/statusChange', isAuthenticated ,  statusChange);
router.delete('/deleteLeaveRequest', isAuthenticated , deleteLeaveRequest);
router.get('/getLeaveRequestByStatus', isAuthenticated , getLeaveRequestByStatus);

export default router;
