import jwt from 'jsonwebtoken';
import appointmentModel from '../models/appointmentModel.js';
import doctorModel from '../models/doctorModel.js';
import bcrypt from 'bcrypt';
import validator from 'validator';
import { v2 as cloudinary } from 'cloudinary';
import userModel from '../models/userModel.js';
import settingsModel from '../models/settingsModel.js';
import payoutModel from '../models/payoutModel.js';
import emailTemplateModel from '../models/emailTemplateModel.js';
import adminModel from '../models/adminModel.js';
import { seedEmailTemplates, sendNotificationEmail, sendCustomHtmlEmail } from '../services/emailService.js';

// Granular RBAC Permission Gating Helper
const checkAdminPermission = (req, requiredPermission) => {
  if (!req.admin) return false;
  if (req.admin.role === 'master') return true;
  return req.admin.permissions && req.admin.permissions[requiredPermission] === true;
};

// API for admin login
const loginAdmin = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.json({ success: false, message: 'Missing credentials' });
    }

    // Validate environment setup
    const missingVars = [];
    if (!process.env.ADMIN_EMAIL) missingVars.push('ADMIN_EMAIL');
    if (!process.env.ADMIN_PASSWORD) missingVars.push('ADMIN_PASSWORD');
    if (!process.env.JWT_SECRET) missingVars.push('JWT_SECRET');

    if (missingVars.length) {
      console.error('Admin login config error – missing env vars:', missingVars);
      return res.status(500).json({
        success: false,
        message: `Server configuration error: missing ${missingVars.join(', ')}`,
      });
    }

    // Dynamic Administrator Lookup
    let admin = await adminModel.findOne({ email: email.toLowerCase() });

    // Seeding fallback for master administrator if collection is empty
    const totalAdmins = await adminModel.countDocuments();
    if (totalAdmins === 0 && email.toLowerCase() === process.env.ADMIN_EMAIL.toLowerCase()) {
      const hashedPassword = await bcrypt.hash(process.env.ADMIN_PASSWORD, 10);
      admin = new adminModel({
        name: 'Master Admin',
        email: process.env.ADMIN_EMAIL.toLowerCase(),
        password: hashedPassword,
        role: 'master',
        permissions: {
          dashboard: true,
          appointments: true,
          doctors: true,
          patients: true,
          payouts: true,
          settings: true
        }
      });
      await admin.save();
      console.log('🌱 Seeded Master Admin dynamically from environment variables.');
    }

    if (!admin) {
      return res.json({ success: false, message: 'Invalid credentials' });
    }

    if (!admin.isActive) {
      return res.json({ success: false, message: 'Your administrative account is suspended' });
    }

    // Verify Password Hash
    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) {
      return res.json({ success: false, message: 'Invalid credentials' });
    }

    // Generate Dynamic Token
    const token = jwt.sign({ id: admin._id, email: admin.email, role: admin.role }, process.env.JWT_SECRET);
    
    return res.json({
      success: true,
      token,
      admin: {
        name: admin.name,
        email: admin.email,
        role: admin.role,
        permissions: admin.permissions
      }
    });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

// API to get all appointments list
const appointmentsAdmin = async (req, res) => {
  try {
    if (!checkAdminPermission(req, 'appointments')) {
      return res.json({ success: false, message: 'Forbidden: You do not have permission to view appointments' });
    }
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
    if (!checkAdminPermission(req, 'appointments')) {
      return res.json({ success: false, message: 'Forbidden: You do not have permission to manage appointments' });
    }
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
    if (!checkAdminPermission(req, 'doctors')) {
      return res.json({ success: false, message: 'Forbidden: You do not have permission to manage doctors' });
    }
    const { name, email, password, speciality, degree, experience, about, fees, address, phone } =
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
      !address ||
      !phone
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
      phone: phone || '',
      date: Date.now(),
      isApproved: true // Doctors created by admin are auto-approved
    };

    const newDoctor = new doctorModel(doctorData);
    await newDoctor.save();

    // Send Approved/Welcome Email & Admin notification (Catch errors silently)
    try {
      await sendNotificationEmail(newDoctor.email, 'doctor_approved', {
        doctorName: newDoctor.name
      });
      await sendNotificationEmail('medicsonlineng@gmail.com', 'admin_signup_notification', {
        userName: newDoctor.name,
        userEmail: newDoctor.email,
        userRole: 'Doctor (Created by Admin)',
        signupTime: new Date().toLocaleString()
      });
    } catch (emailErr) {
      console.error('Approved email error on admin doctor registration:', emailErr);
    }

    res.json({ success: true, message: 'Doctor Added' });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

// API to get all doctors list for admin panel
const allDoctors = async (req, res) => {
  try {
    if (!checkAdminPermission(req, 'doctors')) {
      return res.json({ success: false, message: 'Forbidden: You do not have permission to view doctors' });
    }
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
    if (!checkAdminPermission(req, 'dashboard')) {
      return res.json({ success: false, message: 'Forbidden: You do not have permission to view the dashboard' });
    }
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
    if (!checkAdminPermission(req, 'payouts')) {
      return res.json({ success: false, message: 'Forbidden: You do not have permission to view administrative financials' });
    }
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
    const doctor = await doctorModel.findByIdAndUpdate(docId, { isApproved: true }, { new: true });
    
    if (doctor) {
      try {
        await sendNotificationEmail(doctor.email, 'doctor_approved', {
          doctorName: doctor.name
        });
      } catch (emailErr) {
        console.error('Approved email error on approveDoctor handler:', emailErr);
      }
    }
    
    res.json({ success: true, message: 'Doctor approved successfully' });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

// API to reject doctor
const rejectDoctor = async (req, res) => {
  try {
    if (!checkAdminPermission(req, 'doctors')) {
      return res.json({ success: false, message: 'Forbidden: You do not have permission to manage doctors' });
    }
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
    if (!checkAdminPermission(req, 'doctors')) {
      return res.json({ success: false, message: 'Forbidden: You do not have permission to manage doctors' });
    }
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
    if (!checkAdminPermission(req, 'doctors')) {
      return res.json({ success: false, message: 'Forbidden: You do not have permission to manage doctors' });
    }
    const { docId, name, email, speciality, degree, experience, about, fees, address, phone, image } = req.body;
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
    if (address) {
      updateData.address = typeof address === 'string' ? JSON.parse(address) : address;
    }
    if (phone !== undefined) updateData.phone = phone;

    if (imageFile) {
      const imageUpload = await cloudinary.uploader.upload(imageFile.path, {
        resource_type: 'image'
      });
      updateData.image = imageUpload.secure_url;
    } else if (image) {
      let imageObj = image;
      if (typeof imageObj === 'string' && imageObj.startsWith('{')) {
        try { imageObj = JSON.parse(imageObj); } catch (e) { /* not JSON */ }
      }
      
      if (imageObj && typeof imageObj === 'object' && imageObj.data) {
        const mimeType = imageObj.mimeType || 'image/jpeg';
        console.log('🩺 Admin Portal: Uploading new doctor profile picture to Cloudinary, mime:', mimeType);
        const imageUpload = await cloudinary.uploader.upload(
          `data:${mimeType};base64,${imageObj.data}`,
          { resource_type: 'image' }
        );
        updateData.image = imageUpload.secure_url;
        console.log('✅ New profile picture uploaded:', updateData.image);
      } else if (typeof imageObj === 'string' && imageObj.startsWith('http')) {
        updateData.image = imageObj;
      }
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
    if (!checkAdminPermission(req, 'patients')) {
      return res.json({ success: false, message: 'Forbidden: You do not have permission to manage patients' });
    }
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
    if (!checkAdminPermission(req, 'patients')) {
      return res.json({ success: false, message: 'Forbidden: You do not have permission to view patients' });
    }
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
    if (!checkAdminPermission(req, 'doctors')) {
      return res.json({ success: false, message: 'Forbidden: You do not have permission to manage doctor KYC documents' });
    }
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

const clearDataAdmin = async (req, res) => {
  try {
    // Only master admins are allowed to purge the database!
    if (!req.admin || req.admin.role !== 'master') {
      return res.json({ success: false, message: 'Forbidden: Only Master Admin can purge database collections' });
    }
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

// API to get all email templates
const getEmailTemplates = async (req, res) => {
  try {
    if (!checkAdminPermission(req, 'settings')) {
      return res.json({ success: false, message: 'Forbidden: You do not have permission to view settings or templates' });
    }
    await seedEmailTemplates();
    const templates = await emailTemplateModel.find({});
    res.json({ success: true, templates });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

// API to update an email template
const updateEmailTemplate = async (req, res) => {
  try {
    if (!checkAdminPermission(req, 'settings')) {
      return res.json({ success: false, message: 'Forbidden: You do not have permission to modify templates' });
    }
    const { templateId, subject, body } = req.body;
    if (!templateId || !subject || !body) {
      return res.json({ success: false, message: 'Missing subject or body content' });
    }
    await emailTemplateModel.findByIdAndUpdate(templateId, { subject, body });
    res.json({ success: true, message: 'Email template updated successfully' });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

// API to trigger manually sending reminders for today/tomorrow
const sendAppointmentReminders = async (req, res) => {
  try {
    if (!checkAdminPermission(req, 'settings')) {
      return res.json({ success: false, message: 'Forbidden: You do not have permission to trigger notifications' });
    }
    const today = new Date();
    const todayStr = `${today.getDate()}_${today.getMonth() + 1}_${today.getFullYear()}`;
    
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = `${tomorrow.getDate()}_${tomorrow.getMonth() + 1}_${tomorrow.getFullYear()}`;

    const upcomingAppointments = await appointmentModel.find({
      payment: true,
      cancelled: false,
      isCompleted: false,
      reminderSent: false,
      slotDate: { $in: [todayStr, tomorrowStr] }
    });

    let sentCount = 0;
    for (const appt of upcomingAppointments) {
      const docData = await doctorModel.findById(appt.docId);
      const userData = await userModel.findById(appt.userId);
      if (docData && userData) {
        const emailVars = {
          patientName: userData.name,
          doctorName: docData.name,
          appointmentDate: appt.slotDate.replace(/_/g, '/'),
          appointmentTime: appt.slotTime
        };
        await sendNotificationEmail(userData.email, 'appointment_reminder', emailVars);
        await sendNotificationEmail(docData.email, 'appointment_reminder', emailVars);
        sentCount++;
      }
      appt.reminderSent = true;
      await appt.save();
    }

    res.json({ success: true, message: `Successfully dispatched reminders for ${sentCount} appointments.` });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

// API to send bulk or individual email to patients or doctors
const sendBulkEmailAdmin = async (req, res) => {
  try {
    if (!checkAdminPermission(req, 'settings')) {
      return res.json({ success: false, message: 'Forbidden: You do not have permission to use the broadcaster' });
    }
    const { recipientType, selectedEmails, customEmails, subject, body } = req.body;
    if (!subject || !body) {
      return res.json({ success: false, message: 'Subject and body content are required' });
    }

    let emails = [];

    if (recipientType === 'all-patients') {
      const patients = await userModel.find({}).select('email');
      emails = patients.map(p => p.email).filter(Boolean);
    } else if (recipientType === 'all-doctors') {
      const doctors = await doctorModel.find({}).select('email');
      emails = doctors.map(d => d.email).filter(Boolean);
    } else if (recipientType === 'custom-emails') {
      if (!customEmails) {
        return res.json({ success: false, message: 'Please provide at least one custom email address' });
      }
      emails = customEmails.split(',').map(e => e.trim()).filter(Boolean);
    } else if (recipientType === 'selected-users') {
      if (!selectedEmails || !Array.isArray(selectedEmails)) {
        return res.json({ success: false, message: 'Please select recipients to send the email' });
      }
      emails = selectedEmails.filter(Boolean);
    } else {
      return res.json({ success: false, message: 'Invalid recipient type' });
    }

    if (emails.length === 0) {
      return res.json({ success: false, message: 'No recipients found for this selection' });
    }

    // Send emails
    let sentCount = 0;
    for (const email of emails) {
      const success = await sendCustomHtmlEmail(email, subject, body);
      if (success) {
        sentCount++;
      }
    }

    res.json({ success: true, message: `Successfully broadcasted email to ${sentCount} out of ${emails.length} recipients.` });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

// API to get active admin's profile and permissions (Master or staff restricted)
const getAdminProfile = async (req, res) => {
  try {
    if (!req.admin) {
      return res.json({ success: false, message: 'Admin session not found' });
    }
    res.json({
      success: true,
      admin: {
        name: req.admin.name,
        email: req.admin.email,
        role: req.admin.role,
        permissions: req.admin.permissions
      }
    });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

// API to list all admin staff accounts (Master Admin restricted)
const getAdmins = async (req, res) => {
  try {
    if (!req.admin || req.admin.role !== 'master') {
      return res.json({ success: false, message: 'Forbidden: Master Admin access required' });
    }

    // Self-healing database cleanup of duplicate Master Admins
    const masterEmail = process.env.ADMIN_EMAIL ? process.env.ADMIN_EMAIL.toLowerCase() : 'admin@medicsonline.ng';
    const masterCount = await adminModel.countDocuments({ email: masterEmail, role: 'master' });
    if (masterCount > 1) {
      console.log(`⚠️ Found ${masterCount} duplicate Master Admins. Running self-healing cleanup...`);
      const masterList = await adminModel.find({ email: masterEmail, role: 'master' }).sort({ createdAt: 1 });
      const [primaryMaster, ...duplicates] = masterList;
      for (const dup of duplicates) {
        await adminModel.findByIdAndDelete(dup._id);
        console.log(`🧹 Deleted duplicate Master Admin with ID: ${dup._id}`);
      }
    }

    const admins = await adminModel.find({}).select('-password');
    res.json({ success: true, admins });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

// API to create a new admin staff account (Master Admin restricted)
const createAdmin = async (req, res) => {
  try {
    if (!req.admin || req.admin.role !== 'master') {
      return res.json({ success: false, message: 'Forbidden: Master Admin access required' });
    }
    const { name, email, password, permissions } = req.body;
    
    if (!name || !email || !password) {
      return res.json({ success: false, message: 'Missing admin name, email, or password' });
    }

    if (!validator.isEmail(email)) {
      return res.json({ success: false, message: 'Please enter a valid email address' });
    }

    if (password.length < 8) {
      return res.json({ success: false, message: 'Password must be at least 8 characters long' });
    }

    const exists = await adminModel.findOne({ email: email.toLowerCase() });
    if (exists) {
      return res.json({ success: false, message: 'An administrative account with this email already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newAdmin = new adminModel({
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      role: 'staff',
      permissions: permissions || {
        dashboard: true,
        appointments: true,
        doctors: true,
        patients: true,
        payouts: true,
        settings: true
      }
    });

    await newAdmin.save();
    res.json({ success: true, message: 'New Staff Admin created successfully' });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

// API to update admin permissions or active status (Master Admin restricted)
const updateAdminPermissions = async (req, res) => {
  try {
    if (!req.admin || req.admin.role !== 'master') {
      return res.json({ success: false, message: 'Forbidden: Master Admin access required' });
    }
    const { adminId, permissions, isActive } = req.body;

    const targetAdmin = await adminModel.findById(adminId);
    if (!targetAdmin) {
      return res.json({ success: false, message: 'Admin account not found' });
    }

    if (targetAdmin.role === 'master') {
      return res.json({ success: false, message: 'Cannot edit master admin privileges' });
    }

    if (permissions) targetAdmin.permissions = permissions;
    if (isActive !== undefined) targetAdmin.isActive = isActive;

    await targetAdmin.save();
    res.json({ success: true, message: 'Admin permissions updated successfully' });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

// API to delete admin account (Master Admin restricted)
const deleteAdmin = async (req, res) => {
  try {
    if (!req.admin || req.admin.role !== 'master') {
      return res.json({ success: false, message: 'Forbidden: Master Admin access required' });
    }
    const { adminId } = req.body;

    const targetAdmin = await adminModel.findById(adminId);
    if (!targetAdmin) {
      return res.json({ success: false, message: 'Admin account not found' });
    }

    if (targetAdmin.role === 'master') {
      return res.json({ success: false, message: 'Cannot delete the master admin account' });
    }

    await adminModel.findByIdAndDelete(adminId);
    res.json({ success: true, message: 'Staff Admin removed successfully' });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

// API to delete patient (Master/Staff restricted by patients permission)
const deletePatient = async (req, res) => {
  try {
    if (!checkAdminPermission(req, 'patients')) {
      return res.json({ success: false, message: 'Forbidden: You do not have permission to manage patients' });
    }
    const { patientId } = req.body;

    if (!patientId) {
      return res.json({ success: false, message: 'Patient ID is required' });
    }

    // Delete all appointments associated with the user
    await appointmentModel.deleteMany({ userId: patientId });

    // Delete the user record
    const deletedUser = await userModel.findByIdAndDelete(patientId);
    if (!deletedUser) {
      return res.json({ success: false, message: 'Patient not found' });
    }

    res.json({ success: true, message: 'Patient and associated appointments deleted successfully' });
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
  getEmailTemplates,
  updateEmailTemplate,
  sendAppointmentReminders,
  sendBulkEmailAdmin,
  getAdminProfile,
  getAdmins,
  createAdmin,
  updateAdminPermissions,
  deleteAdmin,
  deletePatient
};