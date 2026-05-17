import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/backend/config/mongodb';
import connectCloudinary from '@/backend/config/cloudinary';
import { runExpressController } from '@/backend/utils/expressAdapter';
import { withEncryption } from '@/backend/middleware/hybridCrypto';
import { withAdminAuth } from '@/backend/middleware/authAdmin';

// Import all admin controllers
import {
  addDoctor,
  loginAdmin,
  allDoctors,
  appointmentsAdmin,
  appointmentCancel,
  adminDashboard,
  allPatients,
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
} from '@/backend/controllers/adminController';

import { changeAvailablity } from '@/backend/controllers/doctorController';

type ActionConfig = {
  controller: any;
  auth?: any;
};

// Map actions to controllers, with necessary middlewares applied
const actionMap: Record<string, ActionConfig> = {
  'login': { controller: loginAdmin },
  'add-doctor': { controller: addDoctor, auth: withAdminAuth },
  'all-doctors': { controller: allDoctors, auth: withAdminAuth },
  'appointments': { controller: appointmentsAdmin, auth: withAdminAuth },
  'cancel-appointment': { controller: appointmentCancel, auth: withAdminAuth },
  'dashboard': { controller: adminDashboard, auth: withAdminAuth },
  'change-availability': { controller: changeAvailablity, auth: withAdminAuth },
  'all-patients': { controller: allPatients, auth: withAdminAuth },
  'approve-doctor': { controller: approveDoctor, auth: withAdminAuth },
  'reject-doctor': { controller: rejectDoctor, auth: withAdminAuth },
  'delete-doctor': { controller: deleteDoctor, auth: withAdminAuth },
  'edit-doctor': { controller: editDoctor, auth: withAdminAuth },
  'edit-patient': { controller: editPatient, auth: withAdminAuth },
  'earnings': { controller: adminEarnings, auth: withAdminAuth },
  'review-kyc': { controller: reviewKyc, auth: withAdminAuth },
  'get-commission-rate': { controller: getCommissionRate, auth: withAdminAuth },
  'set-commission-rate': { controller: setCommissionRate, auth: withAdminAuth },
  'doctor-leaderboard': { controller: doctorLeaderboard, auth: withAdminAuth },
  'get-payouts': { controller: getPayoutsAdmin, auth: withAdminAuth },
  'review-payout': { controller: reviewPayout, auth: withAdminAuth },
  'clear-data': { controller: clearDataAdmin, auth: withAdminAuth },
  'seed-data': { controller: seedDataAdmin, auth: withAdminAuth }
};

async function handleAction(request: NextRequest, context: { params: Promise<{ action: string }> }) {
  await connectDB();
  await connectCloudinary();
  
  const { action } = await context.params;
  const routeConfig = actionMap[action];
  
  if (!routeConfig) {
    return NextResponse.json({ success: false, message: 'Route not found' }, { status: 404 });
  }

  // Create the final handler
  const finalHandler = async (req: any, ctx: any) => {
    return await runExpressController(routeConfig.controller, req, ctx);
  };

  // Apply Auth Middleware if required
  const authWrappedHandler = routeConfig.auth 
    ? routeConfig.auth(finalHandler) 
    : finalHandler;

  return await authWrappedHandler(request, context);
}

// All endpoints in this router support Hybrid Crypto Middleware
export const POST = withEncryption(handleAction);
export const GET = withEncryption(handleAction);
export const PUT = withEncryption(handleAction);
export const DELETE = withEncryption(handleAction);
