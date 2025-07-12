import mongoose from 'mongoose';

const admissionSchema = new mongoose.Schema({
  patient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  bed: { type: mongoose.Schema.Types.ObjectId, ref: 'Bed', required: true },
  admissionDate: { type: Date, required: true },
  dischargeDate: Date,
  totalAmount: Number,
  status: {
    type: String,
    enum: ['pending', 'approved', 'admitted', 'rejected', 'discharged'],
    default: 'pending'
  },
  staff: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
});

const Admission = mongoose.model('Admission', admissionSchema);
export default Admission; 