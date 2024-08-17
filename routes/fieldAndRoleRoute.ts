
import express from 'express'
import { getFieldAndRole, addFieldAndRole ,check } from '../controllers/fieldAndRoleController';
import { isAuthenticated } from '../middlewares/isAuth';
// import { isAuthenticated } from '../middlewares/isAuth';

const router = express.Router();

router.get('/getFieldAndRole', getFieldAndRole);
router.post('/addFieldAndRole', addFieldAndRole);
router.post('/check', isAuthenticated , check);

export default router;
