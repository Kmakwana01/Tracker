import express from 'express'
import { isAuthenticated } from "../middlewares/isAuth";
import { upload } from '../utils/multer';
import { getProfile, updateProfile, updatePassword } from '../controllers/profileController';

const router = express.Router();

router.get('/getProfile/:id', isAuthenticated, getProfile);
router.put('/updateProfile/:id', isAuthenticated, upload.any() , updateProfile);
router.put('/updatePassword/:id', isAuthenticated, updatePassword);

export default router;
