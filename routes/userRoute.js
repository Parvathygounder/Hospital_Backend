import express from 'express';
import { registerUser, loginUser, loginStaff, getProfile, updateProfile, bookAppointment, listAppointment, cancelAppointment, paymentRazorpay, getNotifications, markNotificationRead, getAllPatients, getStaffNotifications, addPatientByStaff } from '../controllers/userController.js';
import authUser from '../middlewares/authUser.js';
import authStaff from '../middlewares/authStaff.js';
import upload from '../middlewares/multer.js';

const userRouter = express.Router();


userRouter.post('/register',registerUser)
userRouter.post('/login', loginUser);
userRouter.post('/staff/login', loginStaff);

userRouter.get('/get-profile',authUser, getProfile)
userRouter.post('/update-profile',upload.single('image'),authUser,updateProfile)
userRouter.post('/book-appointment',authUser,bookAppointment)
userRouter.get('/appointments',authUser,listAppointment)
userRouter.post('/cancel-appointment',authUser,cancelAppointment)
userRouter.post('/payment-razorpay',authUser,paymentRazorpay)

// Notification routes
userRouter.get('/notifications', getNotifications)
userRouter.patch('/notifications/:id/read', markNotificationRead)

// Add this route for admin to get all patients
userRouter.get('/patients', getAllPatients);
userRouter.get('/staff/notifications', authStaff, getStaffNotifications);

// Staff can add patients
userRouter.post('/staff/add-patient', authStaff, addPatientByStaff);


export default userRouter; 
