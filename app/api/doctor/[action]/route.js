import { NextResponse } from 'next/server';
import connectDB from '@/backend/config/mongodb';
import { runExpressController } from '@/backend/utils/expressAdapter';
import { withEncryption } from '@/backend/middleware/hybridCrypto';
import { withDoctorAuth } from '@/backend/middleware/authDoctor';

// Import all doctor controllers
import {
  loginDoctor,
  registerDoctor,
  appointmentsDoctor,
  appointmentCancel,
  doctorList,
  changeAvailablity,
  appointmentComplete,
  doctorDashboard,
  doctorProfile,
  updateDoctorProfile
} from '@/backend/controllers/doctorController';

// Map actions to controllers, with necessary middlewares applied
const actionMap = {
  'login': { controller: loginDoctor },
  'register': { controller: registerDoctor },
  'list': { controller: doctorList },
  'appointments': { controller: appointmentsDoctor, auth: withDoctorAuth },
  'cancel-appointment': { controller: appointmentCancel, auth: withDoctorAuth },
  'complete-appointment': { controller: appointmentComplete, auth: withDoctorAuth },
  'dashboard': { controller: doctorDashboard, auth: withDoctorAuth },
  'profile': { controller: doctorProfile, auth: withDoctorAuth },
  'update-profile': { controller: updateDoctorProfile, auth: withDoctorAuth },
  'change-availability': { controller: changeAvailablity, auth: withDoctorAuth }
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
