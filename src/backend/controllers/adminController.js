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
      let adminCommission = 0;

      appointments.forEach((appt) => {
        if (appt.isCompleted || appt.payment) {
          grossEarnings += appt.amount;
          if (appt.adminCommission !== undefined && appt.adminCommission !== null) {
            adminCommission += appt.adminCommission;
          } else {
            adminCommission += (appt.amount * commRate) / 100;
          }
        }
      });
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

const seedDataAdmin = async (req, res) => {
  try {
    await doctorModel.deleteMany({});
    await userModel.deleteMany({});
    await appointmentModel.deleteMany({});
    await payoutModel.deleteMany({});

    const hashedPassword = await bcrypt.hash('password123', 10);

    const doctorsData = [
      {
        name: 'Dr. Chinonso Egemba',
        email: 'egemba@medicsonline.com',
        password: hashedPassword,
        speciality: 'General physician',
        degree: 'MBBS, MWACP',
        experience: '8 Years',
        about: 'Experienced General Physician dedicated to proactive healthcare education and evidence-based clinical practice in Nigeria. Providing empathetic primary care to help you lead a healthier life.',
        fees: 5000,
        address: { line1: '12 Admiralty Way', line2: 'Lekki Phase 1, Lagos' },
        image: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=300',
        workingHours: [{ start: '09:00', end: '13:00' }, { start: '15:00', end: '18:00' }],
        excludedDays: [0, 6],
        isVerified: true,
        kycStatus: 'approved'
      },
      {
        name: 'Dr. Ola Brown',
        email: 'olabrown@medicsonline.com',
        password: hashedPassword,
        speciality: 'Gynecologist',
        degree: 'MBBS, MSc',
        experience: '12 Years',
        about: 'Consultant Gynecologist and emergency transport pioneer. Passionate about female reproductive wellness, prenatal support, and maternal clinical care in West Africa.',
        fees: 15000,
        address: { line1: '45 Glover Road', line2: 'Ikoyi, Lagos' },
        image: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=300',
        workingHours: [{ start: '10:00', end: '14:00' }, { start: '16:00', end: '20:00' }],
        excludedDays: [0],
        isVerified: true,
        kycStatus: 'approved'
      },
      {
        name: 'Dr. Funmilayo Harvey',
        email: 'funmi@medicsonline.com',
        password: hashedPassword,
        speciality: 'Pediatricians',
        degree: 'MBBS, FWACP (Pead)',
        experience: '10 Years',
        about: 'Consultant Pediatrician specializing in baby immunization schedules, nutrition, and child developmental health. Providing warm healthcare services for families.',
        fees: 8500,
        address: { line1: '8 Wuse II Crescent', line2: 'Abuja, FCT' },
        image: 'https://images.unsplash.com/photo-1594824813573-246434de83fb?auto=format&fit=crop&q=80&w=300',
        workingHours: [{ start: '08:30', end: '12:30' }, { start: '14:00', end: '17:30' }],
        excludedDays: [0, 6],
        isVerified: true,
        kycStatus: 'approved'
      },
      {
        name: 'Dr. Chioma Nnaji',
        email: 'chioma@medicsonline.com',
        password: hashedPassword,
        speciality: 'Dermatologist',
        degree: 'MBBS, FMCP (Derm)',
        experience: '9 Years',
        about: 'Board-certified Dermatologist focusing on skincare pathology, pigment management, and acne therapy customized for African skin types.',
        fees: 10000,
        address: { line1: '18 Isaac John Street', line2: 'Ikeja GRA, Lagos' },
        image: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=300',
        workingHours: [{ start: '11:00', end: '15:00' }],
        excludedDays: [0, 6],
        isVerified: true,
        kycStatus: 'approved'
      },
      {
        name: 'Dr. Babajide Alao',
        email: 'alao@medicsonline.com',
        password: hashedPassword,
        speciality: 'Neurologist',
        degree: 'MBBS, FWACP (Neuro)',
        experience: '15 Years',
        about: 'Consultant Neurologist specializing in neurodegenerative disorders, stroke therapy, migraines, and cognitive wellness.',
        fees: 20000,
        address: { line1: '29 Independence Layout', line2: 'Enugu, Enugu State' },
        image: 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?auto=format&fit=crop&q=80&w=300',
        workingHours: [{ start: '09:00', end: '12:00' }, { start: '14:00', end: '17:00' }],
        excludedDays: [0, 6],
        isVerified: true,
        kycStatus: 'approved'
      },
      {
        name: 'Dr. Ikechukwu Okafor',
        email: 'okafor@medicsonline.com',
        password: hashedPassword,
        speciality: 'Gastroenterologist',
        degree: 'MBBS, FMCP',
        experience: '11 Years',
        about: 'Specialist Gastroenterologist expert in inflammatory bowel diseases, liver diagnoses, stomach ulcers, and digestive rehabilitation.',
        fees: 12500,
        address: { line1: '15 Trans Amadi Road', line2: 'Port Harcourt, Rivers State' },
        image: 'https://images.unsplash.com/photo-1614608682850-e0d6ed316d47?auto=format&fit=crop&q=80&w=300',
        workingHours: [{ start: '10:00', end: '15:00' }],
        excludedDays: [0],
        isVerified: true,
        kycStatus: 'approved'
      }
    ];

    const seededDoctors = await doctorModel.insertMany(doctorsData);

    const patientsData = [
      {
        name: 'Emeka Nwosu',
        email: 'emeka@gmail.com',
        password: hashedPassword,
        gender: 'Male',
        dob: '1995-04-12',
        phone: '+2348031112222',
        address: { line1: '5 Bode Thomas Street', line2: 'Surulere, Lagos' }
      },
      {
        name: 'Amina Bello',
        email: 'amina@gmail.com',
        password: hashedPassword,
        gender: 'Female',
        dob: '1998-09-24',
        phone: '+2348093334444',
        address: { line1: '14 Gwarinpa Estate', line2: 'Abuja, FCT' }
      },
      {
        name: 'Tunde Bakare',
        email: 'tunde@gmail.com',
        password: hashedPassword,
        gender: 'Male',
        dob: '1992-11-05',
        phone: '+2348125556666',
        address: { line1: '27 Ring Road', line2: 'Ibadan, Oyo State' }
      }
    ];

    const seededPatients = await userModel.insertMany(patientsData);

    const today = new Date();
    const doc1 = seededDoctors[0];
    const doc2 = seededDoctors[1];
    const pat1 = seededPatients[0];
    const pat2 = seededPatients[1];

    const appointmentsData = [
      {
        userId: pat1._id,
        docId: doc1._id,
        slotDate: `${today.getDate()}_${today.getMonth() + 1}_${today.getFullYear()}`,
        slotTime: '10:30 AM',
        amount: doc1.fees,
        date: today.getTime(),
        cancelled: false,
        isPaid: true,
        isCompleted: true,
        commissionRate: 20,
        adminCommission: (doc1.fees * 20) / 100,
        doctorNetShare: doc1.fees - (doc1.fees * 20) / 100,
        vitals: { bpm: '76', spo2: '98' }
      },
      {
        userId: pat2._id,
        docId: doc2._id,
        slotDate: `${today.getDate()}_${today.getMonth() + 1}_${today.getFullYear()}`,
        slotTime: '04:30 PM',
        amount: doc2.fees,
        date: today.getTime() - 86400000,
        cancelled: false,
        isPaid: true,
        isCompleted: true,
        commissionRate: 20,
        adminCommission: (doc2.fees * 20) / 100,
        doctorNetShare: doc2.fees - (doc2.fees * 20) / 100,
        vitals: { bpm: '72', spo2: '99' }
      },
      {
        userId: pat1._id,
        docId: doc2._id,
        slotDate: `${today.getDate() + 1}_${today.getMonth() + 1}_${today.getFullYear()}`,
        slotTime: '11:00 AM',
        amount: doc2.fees,
        date: today.getTime() + 86400000,
        cancelled: false,
        isPaid: true,
        isCompleted: false,
        commissionRate: 20,
        adminCommission: (doc2.fees * 20) / 100,
        doctorNetShare: doc2.fees - (doc2.fees * 20) / 100,
        vitals: { bpm: '80', spo2: '97' }
      }
    ];

    await appointmentModel.insertMany(appointmentsData);

    const settings = await settingsModel.findOne({});
    if (!settings) {
      await settingsModel.create({ commissionRate: 20 });
    }

    res.json({
      success: true,
      message: 'Website seeded successfully with real Nigerian doctor data, patients, and initial earnings!'
    });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

const clearDataAdmin = async (req, res) => {
  try {
    const { target } = req.body;
    if (!['doctors', 'appointments', 'patients'].includes(target)) {
      return res.json({ success: false, message: 'Invalid clear target' });
    }

    if (target === 'doctors') {
      await doctorModel.deleteMany({});
      await payoutModel.deleteMany({});
      await appointmentModel.deleteMany({});
      res.json({ success: true, message: 'All doctors, associated payouts, and appointments cleared successfully' });
    } else if (target === 'appointments') {
      await appointmentModel.deleteMany({});
      res.json({ success: true, message: 'All appointments cleared successfully' });
    } else if (target === 'patients') {
      await userModel.deleteMany({});
      await appointmentModel.deleteMany({});
      res.json({ success: true, message: 'All patients and associated appointments cleared successfully' });
    }
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
  reviewPayout,
  clearDataAdmin,
  seedDataAdmin
};