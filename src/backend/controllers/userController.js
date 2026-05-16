import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import validator from 'validator';
import userModel from '../models/userModel.js';
import doctorModel from '../models/doctorModel.js';
import appointmentModel from '../models/appointmentModel.js';
import { v2 as cloudinary } from 'cloudinary';
import paystack from 'paystack';

// Gateway Initialize
const paystackInstance = new paystack(process.env.PAYSTACK_SECRET_KEY);

// API to register user
const registerUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // checking for all data to register user
    if (!name || !email || !password) {
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

    const userData = {
      name,
      email,
      password: hashedPassword
    };

    const newUser = new userModel(userData);
    const user = await newUser.save();
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET);

    res.json({ success: true, token });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

// API to login user
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await userModel.findOne({ email });

    if (!user) {
      return res.json({ success: false, message: 'User does not exist' });
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

// API to get user profile data
const getProfile = async (req, res) => {
  try {
    const { userId } = req.body;
    const userData = await userModel.findById(userId).select('-password');

    res.json({ success: true, userData });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

// API to update user profile
const updateProfile = async (req, res) => {
  try {
    const { userId, name, phone, address, dob, gender } = req.body;
    const imageFile = req.file;

    if (!name || !phone || !dob || !gender) {
      return res.json({ success: false, message: 'Data Missing' });
    }

    await userModel.findByIdAndUpdate(userId, {
      name,
      phone,
      address: JSON.parse(address),
      dob,
      gender
    });

    if (imageFile) {
      // upload image to cloudinary
      const imageUpload = await cloudinary.uploader.upload(imageFile.path, {
        resource_type: 'image'
      });
      const imageURL = imageUpload.secure_url;

      await userModel.findByIdAndUpdate(userId, { image: imageURL });
    }

    res.json({ success: true, message: 'Profile Updated' });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

// Function to generate unique meeting ID
const generateMeetingId = () => {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < 10; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

// API to book appointment
const bookAppointment = async (req, res) => {
  try {
    const { userId, docId, slotDate, slotTime, vitals } = req.body;
    const docData = await doctorModel.findById(docId).select('-password');

    if (!docData.available) {
      return res.json({ success: false, message: 'Doctor Not Available' });
    }

    let slots_booked = docData.slots_booked;

    // checking for slot availablity
    if (slots_booked[slotDate]) {
      if (slots_booked[slotDate].includes(slotTime)) {
        return res.json({ success: false, message: 'Slot Not Available' });
      } else {
        slots_booked[slotDate].push(slotTime);
      }
    } else {
      slots_booked[slotDate] = [];
      slots_booked[slotDate].push(slotTime);
    }

    const userData = await userModel.findById(userId).select('-password');

    delete docData.slots_booked;

    // Generate unique meeting ID
    const meetingId = generateMeetingId();

    const appointmentData = {
      userId,
      docId,
      userData,
      docData,
      amount: docData.fees,
      slotTime,
      slotDate,
      date: Date.now(),
      meetingId,
      vitals
    };

    const newAppointment = new appointmentModel(appointmentData);
    await newAppointment.save();

    // save new slots data in docData
    await doctorModel.findByIdAndUpdate(docId, { slots_booked });

    res.json({ success: true, message: 'Appointment Booked', meetingId });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

// API to cancel appointment
const cancelAppointment = async (req, res) => {
  try {
    const { userId, appointmentId } = req.body;
    const appointmentData = await appointmentModel.findById(appointmentId);

    // verify appointment user
    if (appointmentData.userId !== userId) {
      return res.json({ success: false, message: 'Unauthorized action' });
    }

    await appointmentModel.findByIdAndUpdate(appointmentId, { cancelled: true });

    // releasing doctor slot
    const { docId, slotDate, slotTime } = appointmentData;

    const doctorData = await doctorModel.findById(docId);

    let slots_booked = doctorData.slots_booked;

    slots_booked[slotDate] = slots_booked[slotDate].filter((e) => e !== slotTime);

    await doctorModel.findByIdAndUpdate(docId, { slots_booked });

    res.json({ success: true, message: 'Appointment Cancelled' });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

// API to reschedule appointment
const rescheduleAppointment = async (req, res) => {
  try {
    const { userId, appointmentId, slotDate, slotTime } = req.body;
    const appointmentData = await appointmentModel.findById(appointmentId);

    // verify appointment user
    if (appointmentData.userId !== userId) {
      return res.json({ success: false, message: 'Unauthorized action' });
    }

    if (!appointmentData.cancelled || !appointmentData.payment) {
      return res.json({ success: false, message: 'Only paid cancelled appointments can be rescheduled' });
    }

    const { docId } = appointmentData;
    const docData = await doctorModel.findById(docId);

    if (!docData.available) {
      return res.json({ success: false, message: 'Doctor Not Available' });
    }

    let slots_booked = docData.slots_booked;

    // checking for slot availablity
    if (slots_booked[slotDate]) {
      if (slots_booked[slotDate].includes(slotTime)) {
        return res.json({ success: false, message: 'Slot Not Available' });
      } else {
        slots_booked[slotDate].push(slotTime);
      }
    } else {
      slots_booked[slotDate] = [];
      slots_booked[slotDate].push(slotTime);
    }

    // Generate new meeting ID
    const meetingId = generateMeetingId();

    // Update appointment
    await appointmentModel.findByIdAndUpdate(appointmentId, {
      slotDate,
      slotTime,
      cancelled: false,
      meetingId
    });

    // save new slots data in docData
    await doctorModel.findByIdAndUpdate(docId, { slots_booked });

    res.json({ success: true, message: 'Appointment Rescheduled', meetingId });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

// API to get user appointments for frontend my-appointments page
const listAppointment = async (req, res) => {
  try {
    const { userId } = req.body;
    const appointments = await appointmentModel.find({ userId });

    res.json({ success: true, appointments });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

// API to make payment of appointment using Paystack
const paymentPaystack = async (req, res) => {
  try {
    const { appointmentId, docId, slotDate, slotTime, vitals, userId } = req.body;
    
    const origin = req.headers.origin || 'http://localhost:3000';
    let amount = 0;
    let email = '';
    let metadata = {};

    if (appointmentId) {
      // Payment for an existing appointment (e.g., from my-appointments page)
      const appointmentData = await appointmentModel.findById(appointmentId);
      if (!appointmentData || appointmentData.cancelled) {
        return res.json({ success: false, message: 'Appointment Cancelled or not found' });
      }
      amount = appointmentData.amount;
      email = appointmentData.userData.email;
      metadata = { appointmentId, userId: appointmentData.userId };
    } else {
      // Direct booking: Payment first, capture later
      if (!docId || !slotDate || !slotTime) {
        return res.json({ success: false, message: 'Missing Booking Details' });
      }
      
      const docData = await doctorModel.findById(docId);
      if (!docData || !docData.available) {
        return res.json({ success: false, message: 'Doctor Not Available' });
      }
      
      const userData = await userModel.findById(userId);
      amount = docData.fees;
      email = userData.email;
      metadata = { 
        isNewBooking: true,
        docId, 
        slotDate, 
        slotTime, 
        vitals, 
        userId 
      };
    }

    // creating options for paystack payment
    const options = {
      amount: amount * 100, // Paystack amount is in kobo
      email: email,
      currency: 'NGN',
      callback_url: `${origin}/verify`,
      metadata: metadata
    };

    // creation of a transaction
    const transaction = await paystackInstance.transaction.initialize(options);

    res.json({ success: true, authorization_url: transaction.data.authorization_url });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

// API to verify payment of Paystack
const verifyPaystack = async (req, res) => {
  try {
    const { reference } = req.body;
    
    // verify the transaction
    const transaction = await paystackInstance.transaction.verify(reference);

    if (transaction.data.status === 'success') {
      const metadata = transaction.data.metadata;
      
      if (metadata.isNewBooking) {
        // CAPTURE ONLY AFTER PAYMENT: Create the appointment now
        const { userId, docId, slotDate, slotTime, vitals } = metadata;
        
        const docData = await doctorModel.findById(docId).select('-password');
        if (!docData.available) {
           // This is a rare edge case where slot was taken during payment
           return res.json({ success: false, message: 'Payment successful but doctor no longer available. Please contact support.' });
        }

        let slots_booked = docData.slots_booked;
        if (slots_booked[slotDate] && slots_booked[slotDate].includes(slotTime)) {
           return res.json({ success: false, message: 'Payment successful but slot was taken. Please contact support.' });
        }

        if (slots_booked[slotDate]) {
          slots_booked[slotDate].push(slotTime);
        } else {
          slots_booked[slotDate] = [slotTime];
        }

        const userData = await userModel.findById(userId).select('-password');
        const meetingId = generateMeetingId();
        
        const appointmentData = {
          userId,
          docId,
          userData,
          docData,
          amount: docData.fees,
          slotTime,
          slotDate,
          date: Date.now(),
          meetingId,
          vitals,
          payment: true // Mark as paid immediately
        };

        const newAppointment = new appointmentModel(appointmentData);
        await newAppointment.save();
        
        await doctorModel.findByIdAndUpdate(docId, { slots_booked });
        
        return res.json({ success: true, message: 'Appointment Booked and Paid', meetingId });
      } else {
        // Standard payment update for existing appointment
        const appointmentId = metadata.appointmentId;
        await appointmentModel.findByIdAndUpdate(appointmentId, { payment: true });
        res.json({ success: true, message: 'Payment Successful' });
      }
    } else {
      res.json({ success: false, message: 'Payment Failed' });
    }
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

export {
  loginUser,
  registerUser,
  getProfile,
  updateProfile,
  bookAppointment,
  listAppointment,
  cancelAppointment,
  rescheduleAppointment,
  paymentPaystack,
  verifyPaystack
};
