import nodemailer from 'nodemailer';
import emailTemplateModel from '../models/emailTemplateModel.js';

// Setup dynamic Nodemailer transporter with Google SMTP support
let transporter;

const getTransporter = () => {
  if (transporter) return transporter;

  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;

  if (smtpUser && smtpPass) {
    console.log('📬 Email Service: Google SMTP configured successfully using:', smtpUser);
    transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true, // true for 465, false for other ports
      auth: {
        user: smtpUser,
        pass: smtpPass
      }
    });
  } else {
    console.warn('⚠️ Email Service: SMTP credentials not set. Falling back to Sandbox Mode (Console Logging).');
    transporter = {
      sendMail: async (mailOptions) => {
        console.log('\n=================== SANDBOX EMAIL SENT ===================');
        console.log(`To: ${mailOptions.to}`);
        console.log(`Subject: ${mailOptions.subject}`);
        console.log(`Body Snippet: ${mailOptions.text || mailOptions.html.replace(/<[^>]*>/g, '').slice(0, 150)}...`);
        console.log('==========================================================\n');
        return { messageId: 'sandbox-mock-id' };
      }
    };
  }
  return transporter;
};

// Seed default dynamic templates
const DEFAULT_TEMPLATES = [
  {
    key: 'booking_confirmation',
    name: 'Booking Confirmation (Patient)',
    subject: 'Appointment Booking Confirmed! - Medics-Online',
    description: 'Sent to the patient upon successful appointment scheduling and payment.',
    variables: ['patientName', 'doctorName', 'doctorSpeciality', 'appointmentDate', 'appointmentTime', 'appointmentFee'],
    body: `<p>Dear <strong>{{patientName}}</strong>,</p>
<p>Your medical consultation with <strong>{{doctorName}}</strong> has been successfully booked and paid!</p>
<div style="background: #f8fafc; border-left: 4px solid #5f6FFF; padding: 15px; margin: 20px 0; border-radius: 6px;">
  <p style="margin: 0; font-size: 14px;">👨‍⚕️ <strong>Doctor:</strong> {{doctorName}} ({{doctorSpeciality}})</p>
  <p style="margin: 5px 0 0 0; font-size: 14px;">📅 <strong>Date:</strong> {{appointmentDate}}</p>
  <p style="margin: 5px 0 0 0; font-size: 14px;">⏰ <strong>Time:</strong> {{appointmentTime}}</p>
  <p style="margin: 5px 0 0 0; font-size: 14px;">💰 <strong>Fee Paid:</strong> ₦{{appointmentFee}}</p>
</div>
<p>You can access your appointment details, pre-consultation vitals, chat with the doctor, and enter your live video consult room straight from your patient dashboard at the scheduled time.</p>
<p>Thank you for choosing Medics-Online!</p>`
  },
  {
    key: 'new_booking_doctor',
    name: 'New Booking Notification (Doctor)',
    subject: 'New Appointment Booked! - Medics-Online',
    description: 'Sent to the doctor when a new booking is scheduled.',
    variables: ['doctorName', 'patientName', 'appointmentDate', 'appointmentTime', 'doctorNetShare', 'commissionRate'],
    body: `<p>Dear <strong>{{doctorName}}</strong>,</p>
<p>A patient has successfully scheduled a new appointment consultation with you.</p>
<div style="background: #f8fafc; border-left: 4px solid #5f6FFF; padding: 15px; margin: 20px 0; border-radius: 6px;">
  <p style="margin: 0; font-size: 14px;">👤 <strong>Patient Name:</strong> {{patientName}}</p>
  <p style="margin: 5px 0 0 0; font-size: 14px;">📅 <strong>Date:</strong> {{appointmentDate}}</p>
  <p style="margin: 5px 0 0 0; font-size: 14px;">⏰ <strong>Time:</strong> {{appointmentTime}}</p>
  <p style="margin: 5px 0 0 0; font-size: 14px;">💰 <strong>Your Net Share:</strong> ₦{{doctorNetShare}} (Commission: {{commissionRate}}%)</p>
</div>
<p>Please log in to your Doctor Workspace to check patient pre-consultation details, chat with them, and open the video consultation room at the scheduled time.</p>`
  },
  {
    key: 'booking_invoice',
    name: 'Booking Invoice & Receipt (Patient)',
    subject: 'Your Booking Invoice #{{appointmentId}} - Medics-Online',
    description: 'Sent as a valid billing invoice to patients after payment checkout.',
    variables: ['patientName', 'doctorName', 'appointmentId', 'invoiceDate', 'appointmentFee'],
    body: `<p>Dear <strong>{{patientName}}</strong>,</p>
<p>Thank you for your payment. Here is the formal billing invoice for your booking on Medics-Online.</p>
<div style="border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden; margin: 20px 0; font-family: sans-serif;">
  <div style="background: #5f6FFF; color: white; padding: 15px; font-weight: bold; text-align: center; font-size: 16px;">
    BOOKING INVOICE / RECEIPT
  </div>
  <div style="padding: 20px; background: #ffffff;">
    <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
      <tr>
        <td style="padding: 4px 0; color: #64748b;"><strong>Invoice ID:</strong></td>
        <td style="padding: 4px 0; text-align: right;">#{{appointmentId}}</td>
      </tr>
      <tr>
        <td style="padding: 4px 0; color: #64748b;"><strong>Invoice Date:</strong></td>
        <td style="padding: 4px 0; text-align: right;">{{invoiceDate}}</td>
      </tr>
      <tr>
        <td style="padding: 4px 0; color: #64748b;"><strong>Patient:</strong></td>
        <td style="padding: 4px 0; text-align: right;">{{patientName}}</td>
      </tr>
    </table>
    <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 15px 0;" />
    <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
      <thead>
        <tr style="border-bottom: 2px solid #e2e8f0; text-align: left; color: #475569;">
          <th style="padding: 8px 0;">Description</th>
          <th style="padding: 8px 0; text-align: right;">Amount</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td style="padding: 12px 0;">Telehealth Consultation with {{doctorName}}</td>
          <td style="padding: 12px 0; text-align: right; font-weight: bold;">₦{{appointmentFee}}</td>
        </tr>
        <tr style="border-top: 2px solid #e2e8f0; font-weight: bold; font-size: 15px;">
          <td style="padding: 12px 0; color: #1e293b;">Total Paid</td>
          <td style="padding: 12px 0; text-align: right; color: #5f6FFF;">₦{{appointmentFee}}</td>
        </tr>
      </tbody>
    </table>
  </div>
</div>
<p>This document serves as a valid proof of payment for your medical records and insurance claims.</p>`
  },
  {
    key: 'appointment_reminder',
    name: 'Appointment Reminder (Patient & Doctor)',
    subject: 'Reminder: Upcoming Scheduled Consultation - Medics-Online',
    description: 'Sent automatically to both patient and doctor 24 hours prior to appointment.',
    variables: ['patientName', 'doctorName', 'appointmentDate', 'appointmentTime'],
    body: `<p>Hello,</p>
<p>This is a helpful reminder that you have an upcoming medical consultation scheduled on Medics-Online.</p>
<div style="background: #fffbeb; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; border-radius: 6px;">
  <p style="margin: 0; font-size: 14px;">👨‍⚕️ <strong>Doctor:</strong> {{doctorName}}</p>
  <p style="margin: 5px 0 0 0; font-size: 14px;">👤 <strong>Patient:</strong> {{patientName}}</p>
  <p style="margin: 5px 0 0 0; font-size: 14px;">📅 <strong>Date:</strong> {{appointmentDate}}</p>
  <p style="margin: 5px 0 0 0; font-size: 14px;">⏰ <strong>Time:</strong> {{appointmentTime}}</p>
</div>
<p>Please ensure you are online with a stable internet connection a few minutes before the session starts. You can access the pre-consultation chat room and video session directly from your dashboard panel.</p>`
  },
  {
    key: 'appointment_cancelled',
    name: 'Cancellation Notification (Patient & Doctor)',
    subject: 'Alert: Your Appointment Has Been Cancelled - Medics-Online',
    description: 'Sent to patient/doctor when an appointment is cancelled.',
    variables: ['patientName', 'doctorName', 'appointmentDate', 'cancellationReason'],
    body: `<p>Hello,</p>
<p>We regret to inform you that your upcoming scheduled medical appointment has been cancelled.</p>
<div style="background: #fef2f2; border-left: 4px solid #ef4444; padding: 15px; margin: 20px 0; border-radius: 6px;">
  <p style="margin: 0; font-size: 14px;">👨‍⚕️ <strong>Doctor:</strong> {{doctorName}}</p>
  <p style="margin: 5px 0 0 0; font-size: 14px;">👤 <strong>Patient:</strong> {{patientName}}</p>
  <p style="margin: 5px 0 0 0; font-size: 14px;">📅 <strong>Date:</strong> {{appointmentDate}}</p>
  <p style="margin: 5px 0 0 0; font-size: 14px;">❌ <strong>Reason:</strong> {{cancellationReason}}</p>
</div>
<p>If you scheduled this booking using Paystack payment, your refund has been processed. You can also rebook easily with other available medical specialists or browse new slots.</p>`
  }
];

export const seedEmailTemplates = async () => {
  try {
    for (const temp of DEFAULT_TEMPLATES) {
      const exists = await emailTemplateModel.findOne({ key: temp.key });
      if (!exists) {
        await new emailTemplateModel(temp).save();
        console.log(`🌱 Email Service: Seeded default email template: ${temp.key}`);
      }
    }
  } catch (error) {
    console.error('❌ Email Service: Seeding email templates failed:', error);
  }
};

// Main dispatcher function
export const sendNotificationEmail = async (to, templateKey, variables = {}) => {
  try {
    // Lazy seeding validation
    await seedEmailTemplates();

    // Fetch the template from the database
    const template = await emailTemplateModel.findOne({ key: templateKey });
    if (!template) {
      throw new Error(`Email Template with key "${templateKey}" not found in database.`);
    }

    // Dynamic replacement helper
    const replacePlaceholders = (text, vars) => {
      let resolved = text;
      Object.keys(vars).forEach((key) => {
        const regex = new RegExp(`{{${key}}}`, 'g');
        resolved = resolved.replace(regex, vars[key] || '');
      });
      return resolved;
    };

    const resolvedSubject = replacePlaceholders(template.subject, variables);
    const resolvedBody = replacePlaceholders(template.body, variables);

    // Deep premium custom responsive HTML layout wrapper with logo branding
    const premiumHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${resolvedSubject}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      background-color: #f4f5f8;
      margin: 0;
      padding: 0;
      -webkit-font-smoothing: antialiased;
    }
    .wrapper {
      width: 100%;
      background-color: #f4f5f8;
      padding: 30px 0;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      background-color: #ffffff;
      border-radius: 12px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
      border: 1px solid #e8e8ed;
      overflow: hidden;
    }
    .header {
      background: linear-gradient(135deg, #5f6FFF, #3b4bc4);
      padding: 30px 20px;
      text-align: center;
    }
    .logo {
      font-size: 24px;
      font-weight: 800;
      color: #ffffff;
      text-decoration: none;
      letter-spacing: 1px;
    }
    .logo span {
      color: #38bdf8;
    }
    .content {
      padding: 35px 30px;
      color: #334155;
      font-size: 15px;
      line-height: 1.6;
    }
    .footer {
      background-color: #f8fafc;
      padding: 20px;
      text-align: center;
      border-top: 1px solid #f1f5f9;
      font-size: 12px;
      color: #64748b;
    }
    .footer a {
      color: #5f6FFF;
      text-decoration: none;
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="container">
      <div class="header">
        <a href="#" class="logo">MEDICS<span>ONLINE</span></a>
      </div>
      <div class="content">
        ${resolvedBody}
      </div>
      <div class="footer">
        <p>&copy; ${new Date().getFullYear()} Medics-Online. All rights reserved.</p>
        <p style="margin-top: 5px;">This is an automated operational notification. Please do not reply directly to this email.</p>
      </div>
    </div>
  </div>
</body>
</html>
`;

    const transporterInstance = getTransporter();
    const mailOptions = {
      from: `"${process.env.SMTP_FROM_NAME || 'Medics-Online Telehealth'}" <${process.env.SMTP_USER || 'noreply@medicsonline.ng'}>`,
      to,
      subject: resolvedSubject,
      html: premiumHtml
    };

    const info = await transporterInstance.sendMail(mailOptions);
    console.log(`✅ Email Service: Notification sent successfully [${templateKey}] to: ${to} (ID: ${info.messageId})`);
    return true;
  } catch (error) {
    console.error(`❌ Email Service: Failed to dispatch notification [${templateKey}] to: ${to}. Error:`, error);
    return false;
  }
};

// Generic dispatcher for admin bulk/custom emails with standard responsive design
export const sendCustomHtmlEmail = async (to, subject, bodyContent) => {
  try {
    const resolvedSubject = subject || 'Notification - Medics-Online';
    const resolvedBody = bodyContent || '';

    const premiumHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${resolvedSubject}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      background-color: #f4f5f8;
      margin: 0;
      padding: 0;
      -webkit-font-smoothing: antialiased;
    }
    .wrapper {
      width: 100%;
      background-color: #f4f5f8;
      padding: 30px 0;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      background-color: #ffffff;
      border-radius: 12px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
      border: 1px solid #e8e8ed;
      overflow: hidden;
    }
    .header {
      background: linear-gradient(135deg, #5f6FFF, #3b4bc4);
      padding: 30px 20px;
      text-align: center;
    }
    .logo {
      font-size: 24px;
      font-weight: 800;
      color: #ffffff;
      text-decoration: none;
      letter-spacing: 1px;
    }
    .logo span {
      color: #38bdf8;
    }
    .content {
      padding: 35px 30px;
      color: #334155;
      font-size: 15px;
      line-height: 1.6;
    }
    .footer {
      background-color: #f8fafc;
      padding: 20px;
      text-align: center;
      border-top: 1px solid #f1f5f9;
      font-size: 12px;
      color: #64748b;
    }
    .footer a {
      color: #5f6FFF;
      text-decoration: none;
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="container">
      <div class="header">
        <a href="#" class="logo">MEDICS<span>ONLINE</span></a>
      </div>
      <div class="content">
        ${resolvedBody}
      </div>
      <div class="footer">
        <p>&copy; ${new Date().getFullYear()} Medics-Online. All rights reserved.</p>
        <p style="margin-top: 5px;">This is a custom operational broadcast from site administration.</p>
      </div>
    </div>
  </div>
</body>
</html>
`;

    const transporterInstance = getTransporter();
    const mailOptions = {
      from: `"${process.env.SMTP_FROM_NAME || 'Medics-Online Telehealth'}" <${process.env.SMTP_USER || 'noreply@medicsonline.ng'}>`,
      to,
      subject: resolvedSubject,
      html: premiumHtml
    };

    const info = await transporterInstance.sendMail(mailOptions);
    console.log(`✅ Email Service: Custom operational email sent successfully to: ${to} (ID: ${info.messageId})`);
    return true;
  } catch (error) {
    console.error(`❌ Email Service: Failed to dispatch custom email to: ${to}. Error:`, error);
    return false;
  }
};
