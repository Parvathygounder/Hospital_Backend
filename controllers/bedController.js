import Bed from '../models/bedModel.js';

export async function createBed(req, res) {
  try {
    const bed = new Bed({ ...req.body, staff: req.staffId });
    await bed.save();
    res.status(201).json(bed);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

export async function getBeds(req, res) {
  try {
    const beds = await Bed.find();
    res.json(beds);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

export async function getAvailableBeds(req, res) {
  try {
    const beds = await Bed.find({ status: 'Available' });
    res.json(beds);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

export async function updateBed(req, res) {
  try {
    const bed = await Bed.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(bed);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

export async function deleteBed(req, res) {
  try {
    await Bed.findByIdAndDelete(req.params.id);
    res.json({ message: 'Bed deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

export async function getStaffBeds(req, res) {
  try {
    const beds = await Bed.find({ staff: req.staffId });
    res.json(beds);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
} 