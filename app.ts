import createError from 'http-errors'
import express, { Request, Response, NextFunction } from 'express'
import path from 'path';
import cookieParser from 'cookie-parser'
import logger from 'morgan'
import dotenv from 'dotenv'
import { mongodbConnection } from './database/db';
import cors from 'cors';

mongodbConnection()

dotenv.config()
//router
let app = express();
// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(cors());
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

import usersRouter from './routes/userRoute';
import employeeRouter from './routes/employeeRoute';
import profileRouter from './routes/profileRoute';
import trackerRouter from './routes/trackerRoute';
import fieldAndRoleRouter from './routes/fieldAndRoleRoute';
import taskRouter from './routes/taskRoute';
import leaveRequestRouter from './routes/leaveRequestRoute';
import holidayRouter from './routes/holidayRoute'
import adjustAttendanceRouter from './routes/adjustAttendanceRoute'
import attendanceRouter from './routes/attendanceRoute'

app.use('/', usersRouter);
app.use('/employee', employeeRouter);
app.use('/profile', profileRouter);
app.use('/tracker', trackerRouter);
app.use('/fieldAndRole', fieldAndRoleRouter);
app.use('/task', taskRouter);
app.use('/leaveRequest', leaveRequestRouter);
app.use('/holiday', holidayRouter)
app.use('/adjustAttendance', adjustAttendanceRouter)
app.use('/attendance', attendanceRouter)

const buildPath = path.normalize(path.join(__dirname, "./out"));

app.use(express.static(buildPath));
const rootRouter = express.Router();
rootRouter.get('(/*)?', async (req: Request, res: Response, next: NextFunction) => {
  res.sendFile(path.join(buildPath, "index.html"));
});

app.use(rootRouter);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(async (err: Error, req: Request, res: Response, next: NextFunction) => {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page

  res.status((err as any).status || 500);
  res.render('error');
});

export default app;
