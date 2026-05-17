import mongoose from 'mongoose';

const payoutSchema = new mongoose.Schema(
  {
    docId: { type: mongoose.Schema.Types.ObjectId, ref: 'doctor', required: true },
    amount: { type: Number, required: true },
    bankName: { type: String, required: true },
    accountNumber: { type: String, required: true },
    accountName: { type: String, required: true },
    status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
    rejectionReason: { type: String, default: '' },
    createdAt: { type: Date, default: Date.now }
  },
  { minimize: false }
);

const payoutModel = mongoose.models.payout || mongoose.model('payout', payoutSchema);
export default payoutModel;
