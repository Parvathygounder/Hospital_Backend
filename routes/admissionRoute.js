import express from 'express';
import { admitPatient, dischargePatient, getAdmissions, approveAdmission, rejectAdmission } from '../controllers/admissionController.js';
import authStaff from '../middlewares/authStaff.js';
import { getStaffAdmissions } from '../controllers/admissionController.js';

const router = express.Router();

router.post('/', admitPatient);
router.patch('/:id/discharge', dischargePatient);
router.get('/', getAdmissions); // ?patient=PATIENT_ID for filtering
router.patch('/:id/approve', approveAdmission);
router.patch('/:id/reject', rejectAdmission);
router.get('/staff/my-admissions', authStaff, getStaffAdmissions);

export default router; 