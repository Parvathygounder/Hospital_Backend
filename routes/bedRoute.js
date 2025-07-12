import express from 'express';
import { createBed, getBeds, getAvailableBeds, updateBed, deleteBed } from '../controllers/bedController.js';
import authStaff from '../middlewares/authStaff.js';
import { getStaffBeds } from '../controllers/bedController.js';

const router = express.Router();

router.post('/', createBed);
router.get('/', getBeds);
router.get('/available', getAvailableBeds);
router.get('/staff/my-beds', authStaff, getStaffBeds);
router.put('/:id', updateBed);
router.delete('/:id', deleteBed);

export default router; 