import jwt from 'jsonwebtoken';
import appointmentModel from '../models/appointmentModel.js';
import doctorModel from '../models/doctorModel.js';
import bcrypt from 'bcrypt';
import validator from 'validator';
import { v2 as cloudinary } from 'cloudinary';
import userModel from '../models/userModel.js';
import settingsModel from '../models/settingsModel.js';
import payoutModel from '../models/payoutModel.js';

// API for admin login
const loginAdmin = async (req, res) => {
  try {
    const { email, password } = req.body;

  // ---------------------------------------------------------
  // Validate required environment variables (critical on Vercel)
  // ---------------------------------------------------------
  const missingVars = [];
  if (!process.env.ADMIN_EMAIL) missingVars.push('ADMIN_EMAIL');
  if (!process.env.ADMIN_PASSWORD) missingVars.push('ADMIN_PASSWORD');
  if (!process.env.JWT_SECRET) missingVars.push('JWT_SECRET');

  if (missingVars.length) {
    console.error('Admin login config error – missing env vars:', missingVars);
    return res
      .status(500)
      .json({
        success: false,
        message: `Server configuration error: missing ${missingVars.join(', ')}`,
      });
  }

  // ---------------------------------------------------------
  // Authenticate admin credentials
  // ---------------------------------------------------------
  if (email === process.env.ADMIN_EMAIL && password === process.env.ADMIN_PASSWORD) {
    // Use a payload object for clarity (keeps token stable)
    const token = jwt.sign({ email, password }, process.env.JWT_SECRET);
    return res.json({ success: true, token });
  }

  // Invalid credentials
  return res.json({ success: false, message: 'Invalid credentials' });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

// API to get all appointments list
const appointmentsAdmin = async (req, res) => {
  try {
    const appointments = await appointmentModel.find({});
    res.json({ success: true, appointments });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

// API for appointment cancellation
const appointmentCancel = async (req, res) => {
  try {
    const { appointmentId } = req.body;
    await appointmentModel.findByIdAndUpdate(appointmentId, { cancelled: true });

    res.json({ success: true, message: 'Appointment Cancelled' });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

// API for adding Doctor
const addDoctor = async (req, res) => {
  try {
    const { name, email, password, speciality, degree, experience, about, fees, address } =
      req.body;
    const imageFile = req.file;

    // checking for all data to add doctor
    if (
      !name ||
      !email ||
      !password ||
      !speciality ||
      !degree ||
      !experience ||
      !about ||
      !fees ||
      !address
    ) {
      return res.json({ success: false, message: 'Missing Details' });
    }

    // validating email format
    if (!validator.isEmail(email)) {
      return res.json({ success: false, message: 'Please enter a valid email' });
    }

    // validating strong password
    if (password.length < 8) {
      return res.json({ success: false, message: 'Please enter a strong password' });
    }

    // hashing user password
    const salt = await bcrypt.genSalt(10); // the more no. round the more time it will take
    const hashedPassword = await bcrypt.hash(password, salt);

    // upload image to cloudinary
    const imageUpload = await cloudinary.uploader.upload(imageFile.path, {
      resource_type: 'image'
    });
    const imageUrl = imageUpload.secure_url;

    const doctorData = {
      name,
      email,
      image: imageUrl,
      password: hashedPassword,
      speciality,
      degree,
      experience,
      about,
      fees,
      address: JSON.parse(address),
      date: Date.now(),
      isApproved: true // Doctors created by admin are auto-approved
    };

    const newDoctor = new doctorModel(doctorData);
    await newDoctor.save();
    res.json({ success: true, message: 'Doctor Added' });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

// API to get all doctors list for admin panel
const allDoctors = async (req, res) => {
  try {
    const doctors = await doctorModel.find({}).select('-password');
    res.json({ success: true, doctors });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

// API to get dashboard data for admin panel
const adminDashboard = async (req, res) => {
  try {
    const doctors = await doctorModel.find({});
    const users = await userModel.find({});
    const appointments = await appointmentModel.find({});

    const dashData = {
      doctors: doctors.length,
      appointments: appointments.length,
      patients: users.length,
      latestAppointments: appointments.reverse()
    };

    res.json({ success: true, dashData });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

// API to get earnings for admin panel
const adminEarnings = async (req, res) => {
  try {
    const appointments = await appointmentModel.find({});
    let earnings = 0;

    appointments.map((item) => {
      if (item.isCompleted || item.payment) {
        earnings += item.amount;
      }
    });

    res.json({ success: true, earnings });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

// API to approve doctor
const approveDoctor = async (req, res) => {
  try {
    const { docId } = req.body;
    
    // Update the doctor's approval status
    await doctorModel.findByIdAndUpdate(docId, { isApproved: true });
    
    res.json({ success: true, message: 'Doctor approved successfully' });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

// API to reject doctor
const rejectDoctor = async (req, res) => {
  try {
    const { docId } = req.body;
    
    // Delete the doctor record
    await doctorModel.findByIdAndDelete(docId);
    
    res.json({ success: true, message: 'Doctor rejected and removed successfully' });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
   }
};

// API to delete doctor
const deleteDoctor = async (req, res) => {
  try {
    const { docId } = req.body;
    await doctorModel.findByIdAndDelete(docId);
    res.json({ success: true, message: 'Doctor deleted successfully' });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

// API to edit doctor profile
const editDoctor = async (req, res) => {
  try {
    const { docId, name, email, speciality, degree, experience, about, fees, address } = req.body;
    const imageFile = req.file;

    if (!docId) {
      return res.json({ success: false, message: 'Doctor ID is required' });
    }

    const updateData = {};
    if (name) updateData.name = name;
    if (email) {
      if (!validator.isEmail(email)) {
        return res.json({ success: false, message: 'Please enter a valid email' });
      }
      updateData.email = email;
    }
    if (speciality) updateData.speciality = speciality;
    if (degree) updateData.degree = degree;
    if (experience) updateData.experience = experience;
    if (about) updateData.about = about;
    if (fees) updateData.fees = fees;
    if (address) updateData.address = JSON.parse(address);

    if (imageFile) {
      const imageUpload = await cloudinary.uploader.upload(imageFile.path, {
        resource_type: 'image'
      });
      updateData.image = imageUpload.secure_url;
    }

    await doctorModel.findByIdAndUpdate(docId, updateData);
    res.json({ success: true, message: 'Doctor profile updated successfully' });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

// API to edit patient profile
const editPatient = async (req, res) => {
  try {
    const {
      patientId,
      name,
      email,
      phone,
      gender,
      dob,
      addressLine1,
      addressLine2
    } = req.body;
    const imageFile = req.file;

    if (!patientId) {
      return res.json({ success: false, message: 'Patient ID is required' });
    }

    const updateData = {};
    if (name) updateData.name = name;
    if (email) updateData.email = email;
    if (phone) updateData.phone = phone;
    if (gender) updateData.gender = gender;
    if (dob) updateData.dob = dob;
if (addressLine1 || addressLine2) {
  updateData.address = {
    line1: addressLine1 || '',
    line2: addressLine2 || ''
  };
}
if (imageFile) {
  const imageUpload = await cloudinary.uploader.upload(imageFile.path, {
    resource_type: 'image'
  });
  updateData.image = imageUpload.secure_url;
}

    await userModel.findByIdAndUpdate(patientId, updateData);
    res.json({ success: true, message: 'Patient profile updated successfully' });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

// API to get all patients list for admin panel
const allPatients = async (req, res) => {
  try {
    const patients = await userModel.find({}).select('-password');
    res.json({ success: true, patients });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

// API to review and approve/reject doctor KYC documents
const reviewKyc = async (req, res) => {
  try {
    const { docId, action, reason } = req.body;

    if (!docId || !action) {
      return res.json({ success: false, message: 'Missing doctor ID or action' });
    }

    if (action === 'approve') {
      await doctorModel.findByIdAndUpdate(docId, {
        kycStatus: 'approved',
        isVerified: true,
        kycRejectionReason: ''
      });
      res.json({ success: true, message: 'Doctor KYC approved and verified badge granted' });
    } else if (action === 'reject') {
      if (!reason) {
        return res.json({ success: false, message: 'Reason is required for rejection' });
      }
      await doctorModel.findByIdAndUpdate(docId, {
        kycStatus: 'rejected',
        isVerified: false,
        kycRejectionReason: reason
      });
      res.json({ success: true, message: 'Doctor KYC rejected with reason' });
    } else {
      res.json({ success: false, message: 'Invalid action' });
    }
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

const getCommissionRate = async (req, res) => {
  try {
    let setting = await settingsModel.findOne({ key: 'commissionRate' });
    if (!setting) {
      setting = new settingsModel({ key: 'commissionRate', value: '20' });
      await setting.save();
    }
    res.json({ success: true, commissionRate: parseInt(setting.value, 10) });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

const setCommissionRate = async (req, res) => {
  try {
    const { commissionRate } = req.body;
    if (commissionRate === undefined || isNaN(commissionRate) || commissionRate < 0 || commissionRate > 100) {
      return res.json({ success: false, message: 'Please enter a valid commission rate percentage (0-100)' });
    }
    let setting = await settingsModel.findOne({ key: 'commissionRate' });
    if (!setting) {
      setting = new settingsModel({ key: 'commissionRate', value: String(commissionRate) });
    } else {
      setting.value = String(commissionRate);
    }
    await setting.save();
    res.json({ success: true, message: 'Commission rate updated successfully' });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

const doctorLeaderboard = async (req, res) => {
  try {
    let setting = await settingsModel.findOne({ key: 'commissionRate' });
    const commRate = setting ? parseInt(setting.value, 10) : 20;

    const doctors = await doctorModel.find({ isApproved: true });

    const leaderboardData = [];
    for (const doc of doctors) {
      const appointments = await appointmentModel.find({ docId: doc._id });
      let grossEarnings = 0;
      appointments.forEach((appt) => {
        if (appt.isCompleted || appt.payment) {
          grossEarnings += appt.amount;
        }
      });
      const adminCommission = (grossEarnings * commRate) / 100;
      const netShare = grossEarnings - adminCommission;

      leaderboardData.push({
        _id: doc._id,
        name: doc.name,
        image: doc.image,
        speciality: doc.speciality,
        isVerified: doc.isVerified,
        grossEarnings,
        adminCommission,
        netShare,
        bookingsCount: appointments.filter(a => a.isCompleted || a.payment).length
      });
    }

    leaderboardData.sort((a, b) => b.grossEarnings - a.grossEarnings);

    res.json({ success: true, leaderboard: leaderboardData });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

const getPayoutsAdmin = async (req, res) => {
  try {
    const payouts = await payoutModel.find({}).populate('docId', 'name image speciality isVerified').sort({ createdAt: -1 });
    res.json({ success: true, payouts });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

const reviewPayout = async (req, res) => {
  try {
    const { payoutId, status, rejectionReason } = req.body;
    if (!['approved', 'rejected'].includes(status)) {
      return res.json({ success: false, message: 'Invalid payout status' });
    }

    const payout = await payoutModel.findById(payoutId);
    if (!payout) {
      return res.json({ success: false, message: 'Payout request not found' });
    }

    if (payout.status !== 'pending') {
      return res.json({ success: false, message: 'Payout has already been processed' });
    }

    payout.status = status;
    if (status === 'rejected') {
      payout.rejectionReason = rejectionReason || 'Rejected by Admin';
    }
    await payout.save();

    res.json({ success: true, message: `Payout request ${status} successfully` });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

export {
  loginAdmin,
  appointmentsAdmin,
  appointmentCancel,
  addDoctor,
  allDoctors,
  allPatients,
  adminDashboard,
  approveDoctor,
  rejectDoctor,
  deleteDoctor,
  editDoctor,
  editPatient,
  adminEarnings,
  reviewKyc,
  getCommissionRate,
  setCommissionRate,
  doctorLeaderboard,
  getPayoutsAdmin,
  reviewPayout
};