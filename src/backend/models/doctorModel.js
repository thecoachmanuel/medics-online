import mongoose from 'mongoose';

const doctorSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    image: { type: String, required: true },
    speciality: { type: String, required: true },
    degree: { type: String, required: true },
    experience: { type: String, required: true },
    about: { type: String, required: true },
    available: { type: Boolean, default: true },
    isApproved: { type: Boolean, default: false },
    fees: { type: Number, required: true },
    slots_booked: { type: Object, default: {} },
    address: { type: Object, required: true },
    date: { type: Number, required: true },
    averageRating: { type: Number, default: 0 },
    ratingsCount: { type: Number, default: 0 },
    reviews: {
      type: [
        {
          userId: { type: String, required: true },
          userName: { type: String, required: true },
          userImage: { type: String },
          rating: { type: Number, required: true },
          comment: { type: String },
          date: { type: Number, default: Date.now }
        }
      ],
      default: []
    },
    kycStatus: {
      type: String,
      enum: ['not_submitted', 'pending', 'approved', 'rejected'],
      default: 'not_submitted'
    },
    kycIdDocument: { type: String },
    kycLicenseDocument: { type: String },
    kycRejectionReason: { type: String, default: '' },
    isVerified: { type: Boolean, default: false }
  },
  { minimize: false }
);

const doctorModel = mongoose.models.doctor || mongoose.model('doctor', doctorSchema);
export default doctorModel;
