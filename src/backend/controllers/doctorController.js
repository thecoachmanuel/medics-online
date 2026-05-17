import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import doctorModel from '../models/doctorModel.js';
import appointmentModel from '../models/appointmentModel.js';
import validator from 'validator';
import { v2 as cloudinary } from 'cloudinary';

// API for doctor Login
const loginDoctor = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await doctorModel.findOne({ email });

    if (!user) {
      return res.json({ success: false, message: 'Invalid credentials' });
    }

    // Check if doctor is approved
    if (!user.isApproved) {
      return res.json({ success: false, message: 'Your account is pending approval by admin' });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (isMatch) {
      const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET);
      res.json({ success: true, token });
    } else {
      res.json({ success: false, message: 'Invalid credentials' });
    }
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

// API for doctor registration
const registerDoctor = async (req, res) => {
  try {
    const { name, email, password, speciality, degree, experience, about, fees, address, workingHoursStart, workingHoursEnd, excludedDays } =
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

    // checking if doctor already exists
    const exists = await doctorModel.findOne({ email });
    if (exists) {
      return res.json({ success: false, message: 'Doctor with this email already exists' });
    }

    // hashing user password
    const salt = await bcrypt.genSalt(10); // the more no. round the more time it will take
    const hashedPassword = await bcrypt.hash(password, salt);

    // upload image to cloudinary
    const imageUpload = await cloudinary.uploader.upload(imageFile.path, {
      resource_type: 'image'
    });
    const imageUrl = imageUpload.secure_url;

    const parsedExcludedDays = excludedDays 
      ? (typeof excludedDays === 'string' ? JSON.parse(excludedDays) : excludedDays) 
      : [];

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
      workingHoursStart: workingHoursStart || '10:00',
      workingHoursEnd: workingHoursEnd || '22:00',
      excludedDays: parsedExcludedDays,
      date: Date.now(),
      isApproved: false // Doctors registered by themselves need approval
    };

    const newDoctor = new doctorModel(doctorData);
    await newDoctor.save();
    res.json({ success: true, message: 'Doctor Registered. Awaiting admin approval.' });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

// API to get doctor appointments for doctor panel
const appointmentsDoctor = async (req, res) => {
  try {
    const { docId } = req.body;
    const appointments = await appointmentModel.find({ docId });

    res.json({ success: true, appointments });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

// API to cancel appointment for doctor panel
const appointmentCancel = async (req, res) => {
  try {
    const { docId, appointmentId, cancellationReason, suggestedRebookTime } = req.body;

    if (!cancellationReason || !suggestedRebookTime) {
      return res.json({ success: false, message: 'Cancellation reason and suggested rebook time are required' });
    }

    const appointmentData = await appointmentModel.findById(appointmentId);
    if (appointmentData && appointmentData.docId === docId) {
      // release doctor slot
      const { slotDate, slotTime } = appointmentData;
      const doctorData = await doctorModel.findById(docId);
      
      if (doctorData) {
        let slots_booked = doctorData.slots_booked || {};
        if (slots_booked[slotDate]) {
          slots_booked[slotDate] = slots_booked[slotDate].filter((e) => e !== slotTime);
          await doctorModel.findByIdAndUpdate(docId, { slots_booked });
        }
      }

      await appointmentModel.findByIdAndUpdate(appointmentId, { 
        cancelled: true,
        cancellationReason,
        suggestedRebookTime,
        cancelledBy: 'doctor'
      });
      return res.json({ success: true, message: 'Appointment Cancelled' });
    }

    res.json({ success: false, message: 'Appointment not found or unauthorized' });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

// API to mark appointment accepted for doctor panel
const appointmentComplete = async (req, res) => {
  try {
    const { docId, appointmentId } = req.body;

    const appointmentData = await appointmentModel.findById(appointmentId);
    if (appointmentData && appointmentData.docId === docId) {
      await appointmentModel.findByIdAndUpdate(appointmentId, { isCompleted: true });
      return res.json({ success: true, message: 'Appointment Accepted' });
    }

    res.json({ success: false, message: 'Appointment Cancelled' });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

// API to get all doctors list for Frontend
const doctorList = async (req, res) => {
  try {
    const doctors = await doctorModel.find({ isApproved: true }).select(['-password', '-email']);
    res.json({ success: true, doctors });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

// API to change doctor availablity for Admin and Doctor Panel
const changeAvailablity = async (req, res) => {
  try {
    const { docId } = req.body;

    const docData = await doctorModel.findById(docId);
    await doctorModel.findByIdAndUpdate(docId, { available: !docData.available });
    res.json({ success: true, message: 'Availablity Changed' });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

// API to get doctor profile for  Doctor Panel
const doctorProfile = async (req, res) => {
  try {
    const { docId } = req.body;
    const profileData = await doctorModel.findById(docId).select('-password');

    res.json({ success: true, profileData });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

// API to update doctor profile data from  Doctor Panel
const updateDoctorProfile = async (req, res) => {
  try {
    const { docId, fees, address, available, about, workingHoursStart, workingHoursEnd, excludedDays } = req.body;

    const updateData = {};
    if (fees !== undefined) updateData.fees = fees;
    if (address !== undefined) updateData.address = address;
    if (available !== undefined) updateData.available = available;
    if (about !== undefined) updateData.about = about;
    if (workingHoursStart !== undefined) updateData.workingHoursStart = workingHoursStart;
    if (workingHoursEnd !== undefined) updateData.workingHoursEnd = workingHoursEnd;
    if (excludedDays !== undefined) {
      updateData.excludedDays = typeof excludedDays === 'string' ? JSON.parse(excludedDays) : excludedDays;
    }

    await doctorModel.findByIdAndUpdate(docId, updateData);

    res.json({ success: true, message: 'Profile Updated' });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

// API to get dashboard data for doctor panel
const doctorDashboard = async (req, res) => {
  try {
    const { docId } = req.body;

    const appointments = await appointmentModel.find({ docId });

    let earnings = 0;

    appointments.map((item) => {
      if (item.isCompleted || item.payment) {
        earnings += item.amount;
      }
    });

    let patients = [];

    appointments.map((item) => {
      if (!patients.includes(item.userId)) {
        patients.push(item.userId);
      }
    });

    const dashData = {
      earnings,
      appointments: appointments.length,
      patients: patients.length,
      latestAppointments: appointments.reverse()
    };

    res.json({ success: true, dashData });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

// API to save consultation notes and prescription
const saveConsultation = async (req, res) => {
  try {
    const { docId, appointmentId, notes, prescription } = req.body;

    let appointmentData = null;
    if (appointmentId && appointmentId.length === 24) {
      try {
        appointmentData = await appointmentModel.findById(appointmentId);
      } catch (e) {
        // Suppress cast errors if they happen
      }
    }
    
    if (!appointmentData && appointmentId) {
      appointmentData = await appointmentModel.findOne({ meetingId: appointmentId });
    }

    if (appointmentData && appointmentData.docId === docId) {
      await appointmentModel.findByIdAndUpdate(appointmentData._id, { 
        notes, 
        prescription,
        isCompleted: true 
      });
      return res.json({ success: true, message: 'Consultation saved successfully' });
    }

    res.json({ success: false, message: 'Appointment not found or unauthorized' });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

// API to submit KYC documents for doctor panel
const submitKycDoctor = async (req, res) => {
  try {
    const { docId } = req.body;
    const kycIdDocumentObj = req.body.kycIdDocument;
    const kycLicenseDocumentObj = req.body.kycLicenseDocument;

    if (!kycIdDocumentObj || !kycLicenseDocumentObj) {
      return res.json({ success: false, message: 'Both ID and License documents are required' });
    }

    console.log('🩺 Submitting KYC for doctor:', docId);
    
    // Upload both to Cloudinary with auto resource type so PDF and JPG both work perfectly
    const idUpload = await cloudinary.uploader.upload(
      `data:${kycIdDocumentObj.mimeType};base64,${kycIdDocumentObj.data}`,
      { resource_type: 'auto' }
    );
    const licenseUpload = await cloudinary.uploader.upload(
      `data:${kycLicenseDocumentObj.mimeType};base64,${kycLicenseDocumentObj.data}`,
      { resource_type: 'auto' }
    );

    console.log('✅ KYC Documents uploaded to Cloudinary');

    await doctorModel.findByIdAndUpdate(docId, {
      kycStatus: 'pending',
      kycIdDocument: idUpload.secure_url,
      kycLicenseDocument: licenseUpload.secure_url,
      kycRejectionReason: ''
    });

    res.json({ success: true, message: 'KYC documents submitted successfully' });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

export {
  loginDoctor,
  registerDoctor,
  appointmentsDoctor,
  appointmentCancel,
  doctorList,
  changeAvailablity,
  appointmentComplete,
  doctorDashboard,
  doctorProfile,
  updateDoctorProfile,
  saveConsultation,
  submitKycDoctor
};
