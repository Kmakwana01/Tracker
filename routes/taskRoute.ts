import express from 'express'
import { isAuthenticated } from "../middlewares/isAuth";
import { upload } from '../utils/multer';
import { addTask , getTasksList ,updateTask ,deleteTask} from '../controllers/taskController';

const router = express.Router();

router.post('/addTask', isAuthenticated, addTask);
router.get('/getTasksList', isAuthenticated, getTasksList);
router.put('/updateTask', isAuthenticated, updateTask);
router.delete('/deleteTask', isAuthenticated, deleteTask);
// router.put('/updateProfile/:id', isAuthenticated, upload.any() , updateProfile);
// router.put('/updatePassword/:id', isAuthenticated, updatePassword);

export default router;
