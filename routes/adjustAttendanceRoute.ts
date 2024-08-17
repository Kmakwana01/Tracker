import express from "express";
import { isAuthenticated } from "../middlewares/isAuth";
import { createAdjustAttendance } from "../controllers/adjustAttendanceController";

const router = express.Router();

router.post('/create', isAuthenticated, createAdjustAttendance)

export default router;
