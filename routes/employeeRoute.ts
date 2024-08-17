import express from 'express'
import { isAuthenticated } from "../middlewares/isAuth";
import { createEmployee ,getAllEmployees ,updateEmployee ,deleteEmployee } from '../controllers/employeeController'
const router = express.Router();
/* GET users listing. */

router.post('/createEmployee', isAuthenticated , createEmployee)
router.get('/getEmployees', isAuthenticated , getAllEmployees)
router.patch('/updateEmployee/:id', isAuthenticated , updateEmployee)
router.delete('/deleteEmployee/:id', isAuthenticated , deleteEmployee)

export default router;
