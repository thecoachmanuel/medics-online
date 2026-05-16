import { NextResponse } from 'next/server';
import connectDB from '@/backend/config/mongodb';
import { runExpressController } from '@/backend/utils/expressAdapter';
import { withEncryption } from '@/backend/middleware/hybridCrypto';
import { withAdminAuth } from '@/backend/middleware/authAdmin';

// Import all admin controllers
import {
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
  editPatient
} from '@/backend/controllers/adminController';

// Map actions to controllers, with necessary middlewares applied
const actionMap = {
  'login': { controller: loginAdmin },
  'appointments': { controller: appointmentsAdmin, auth: withAdminAuth },
  'cancel-appointment': { controller: appointmentCancel, auth: withAdminAuth },
  'add-doctor': { controller: addDoctor, auth: withAdminAuth },
  'all-doctors': { controller: allDoctors, auth: withAdminAuth },
  'all-patients': { controller: allPatients, auth: withAdminAuth },
  'dashboard': { controller: adminDashboard, auth: withAdminAuth },
  'approve-doctor': { controller: approveDoctor, auth: withAdminAuth },
  'reject-doctor': { controller: rejectDoctor, auth: withAdminAuth },
  'delete-doctor': { controller: deleteDoctor, auth: withAdminAuth },
  'edit-doctor': { controller: editDoctor, auth: withAdminAuth },
  'edit-patient': { controller: editPatient, auth: withAdminAuth }
};

async function handleAction(request, context) {
  await connectDB();
  
  const params = await context.params;
  const action = params.action;
  
  const routeConfig = actionMap[action];
  
  if (!routeConfig) {
    return NextResponse.json({ success: false, message: 'Route not found' }, { status: 404 });
  }

  const finalHandler = async (req, ctx) => {
    return await runExpressController(routeConfig.controller, req, ctx);
  };

  const authWrappedHandler = routeConfig.auth 
    ? routeConfig.auth(finalHandler) 
    : finalHandler;

  return await authWrappedHandler(request, context);
}

export const POST = withEncryption(handleAction);
export const GET = withEncryption(handleAction);
export const PUT = withEncryption(handleAction);
export const DELETE = withEncryption(handleAction);
