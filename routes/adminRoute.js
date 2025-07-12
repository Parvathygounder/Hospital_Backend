import express from 'express';
import { addDoctor, allDoctors, loginAdmin, appointmentsAdmin, AppointmentCancel, adminDashboard, addStaff, getAllStaff, deleteStaff, updateStaff, getAdminNotifications, markNotificationRead } from '../controllers/adminController.js';
import upload from '../middlewares/multer.js';
import authAdmin from '../middlewares/authAdmin.js';
import { changeAvailability } from '../controllers/doctorController.js';


const adminRouter = express.Router();


adminRouter.post('/add-doctor',authAdmin, upload.single('image'), addDoctor);
adminRouter.post('/login', loginAdmin);
adminRouter.post('/all-doctors',authAdmin,allDoctors);
adminRouter.post('/change-availability',authAdmin,changeAvailability);
adminRouter.get('/appointments',authAdmin,appointmentsAdmin)
adminRouter.post('/cancel-appointment',authAdmin, AppointmentCancel)
adminRouter.get('/dashboard',authAdmin,adminDashboard)
adminRouter.post('/add-staff',authAdmin, upload.single('image'), addStaff);
adminRouter.get('/all-staff',authAdmin,getAllStaff);
adminRouter.delete('/staff/:id', authAdmin, deleteStaff);
adminRouter.put('/staff/:id', authAdmin, upload.single('image'), updateStaff);
adminRouter.get('/notifications', authAdmin, getAdminNotifications);
adminRouter.patch('/notifications/:id/read', authAdmin, markNotificationRead);


export default adminRouter;
