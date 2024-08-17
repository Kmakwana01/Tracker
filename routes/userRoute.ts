import express from "express";
import { isAuthenticated } from "../middlewares/isAuth";
import { Login, SignUp, compareCode, forgetPassword, logOut, resetPassword, token , appleV2Webhook, appleV2WebhookGet ,sendEmailForError } from "../controllers/userController";

const router = express.Router();

router.post("/signup", SignUp);
router.post("/login", Login);
router.post("/forgetPassword", forgetPassword);
router.post("/compareCode", compareCode);
router.post("/resetPassword", resetPassword);
router.post("/logout", isAuthenticated, logOut);
router.post("/token", token);
router.post("/appleV2Webhook", appleV2Webhook);
router.get("/appleV2WebhookGet", appleV2WebhookGet);
router.post("/sendEmailForError", sendEmailForError);

export default router;
