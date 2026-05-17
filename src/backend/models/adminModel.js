import mongoose from 'mongoose';

const adminSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, required: true, enum: ['master', 'staff'], default: 'staff' },
  permissions: {
    dashboard: { type: Boolean, default: true },
    appointments: { type: Boolean, default: true },
    doctors: { type: Boolean, default: true },
    patients: { type: Boolean, default: true },
    payouts: { type: Boolean, default: true },
    settings: { type: Boolean, default: true }
  },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

const adminModel = mongoose.models.admin || mongoose.model('admin', adminSchema);
export default adminModel;
