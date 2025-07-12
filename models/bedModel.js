import mongoose from 'mongoose';

const bedSchema = new mongoose.Schema({
  type: { type: String, enum: ['General', 'Private', 'ICU'], required: true },
  ratePerDay: { type: Number, required: true },
  status: { type: String, enum: ['Available', 'Occupied', 'Maintenance'], default: 'Available' },
  features: [String],
  staff: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
});

const Bed = mongoose.model('Bed', bedSchema);
export default Bed; 