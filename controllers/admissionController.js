import Admission from '../models/admissionModel.js';
import Bed from '../models/bedModel.js';
import Notification from '../models/notificationModel.js';
import User from '../models/userModel.js';

// Prevent overlapping admissions for patient or bed
async function hasOverlappingAdmission(patient, bed, admissionDate) {
  const overlapping = await Admission.findOne({
    $or: [
      { patient, status: { $in: ['pending', 'approved', 'admitted'] }, dischargeDate: { $exists: false } },
      { bed, status: { $in: ['pending', 'approved', 'admitted'] }, dischargeDate: { $exists: false } }
    ]
  });
  return !!overlapping;
}

export async function admitPatient(req, res) {
  try {
    const { patient, bed, admissionDate } = req.body;
    if (await hasOverlappingAdmission(patient, bed, admissionDate)) {
      return res.status(400).json({ error: 'Overlapping admission exists for patient or bed.' });
    }
    // Create admission as pending
    const admission = new Admission({ patient, bed, admissionDate, status: 'pending', staff: req.staffId });
    await admission.save();
    // Notify patient
    await Notification.create({
      user: patient,
      message: 'Your admission request has been submitted and is pending approval.',
      type: 'admission'
    });
    res.status(201).json(admission);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

export async function approveAdmission(req, res) {
  try {
    const admission = await Admission.findById(req.params.id).populate('bed');
    if (!admission) return res.status(404).json({ error: 'Admission not found' });
    if (admission.status !== 'pending') return res.status(400).json({ error: 'Admission is not pending' });
    // Occupy bed
    await Bed.findByIdAndUpdate(admission.bed._id, { status: 'Occupied' });
    admission.status = 'admitted';
    await admission.save();
    // Notify patient
    await Notification.create({
      user: admission.patient,
      message: `Your admission request has been approved. You are now admitted to a ${admission.bed.type} bed.`,
      type: 'admission'
    });
    res.json(admission);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

export async function rejectAdmission(req, res) {
  try {
    const admission = await Admission.findById(req.params.id);
    if (!admission) return res.status(404).json({ error: 'Admission not found' });
    if (admission.status !== 'pending') return res.status(400).json({ error: 'Admission is not pending' });
    admission.status = 'rejected';
    await admission.save();
    // Notify patient
    await Notification.create({
      user: admission.patient,
      message: 'Your admission request has been rejected.',
      type: 'admission'
    });
    res.json(admission);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

export async function dischargePatient(req, res) {
  try {
    const { dischargeDate } = req.body;
    const admission = await Admission.findById(req.params.id).populate('bed');
    if (!admission) return res.status(404).json({ error: 'Admission not found' });
    // Calculate total amount
    const days = Math.ceil((new Date(dischargeDate) - new Date(admission.admissionDate)) / (1000 * 60 * 60 * 24)) || 1;
    const totalAmount = days * admission.bed.ratePerDay;
    admission.dischargeDate = dischargeDate;
    admission.totalAmount = totalAmount;
    admission.status = 'discharged';
    await admission.save();
    // Mark bed as available
    await Bed.findByIdAndUpdate(admission.bed._id, { status: 'Available' });
    // Notify patient
    await Notification.create({
      user: admission.patient,
      message: `You have been discharged. Your total bill is ₹${totalAmount}.`,
      type: 'admission'
    });
    res.json(admission);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

export async function getAdmissions(req, res) {
  try {
    const { patient } = req.query;
    let query = {};
    if (patient) query.patient = patient;
    const admissions = await Admission.find(query).populate('patient bed');
    res.json(admissions);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

export async function getStaffAdmissions(req, res) {
  try {
    const admissions = await Admission.find({ staff: req.staffId }).populate('patient bed');
    res.json(admissions);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
} 