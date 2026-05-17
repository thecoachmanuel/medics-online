import mongoose from 'mongoose';

const appointmentSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  docId: { type: String, required: true },
  slotDate: { type: String, required: true },
  slotTime: { type: String, required: true },
  userData: { type: Object, required: true },
  docData: { type: Object, required: true },
  amount: { type: Number, required: true },
  date: { type: Number, required: true },
  cancelled: { type: Boolean, default: false },
  payment: { type: Boolean, default: false },
  isCompleted: { type: Boolean, default: false },
  meetingId: { type: String, required: true },
  vitals: {
    bpm: { type: String, default: '---' },
    spo2: { type: String, default: '---' },
    timestamp: { type: Number, default: Date.now }
  },
  notes: { type: String, default: '' },
  prescription: { type: String, default: '' },
  cancellationReason: { type: String, default: '' },
  suggestedRebookTime: { type: String, default: '' },
  cancelledBy: { type: String, default: '' },
  isRated: { type: Boolean, default: false },
  rating: { type: Number },
  reviewComment: { type: String },
  commissionRate: { type: Number },
  adminCommission: { type: Number },
  doctorNetShare: { type: Number },
  chatHistory: [
    {
      sender: { type: String },
      message: { type: String },
      timestamp: { type: Number, default: Date.now }
    }
  ]
});

const appointmentModel =
  mongoose.models.appointment || mongoose.model('appointment', appointmentSchema);
export default appointmentModel;
