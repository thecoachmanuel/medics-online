import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/backend/config/mongodb';
import { runExpressController } from '@/backend/utils/expressAdapter';
import { withEncryption } from '@/backend/middleware/hybridCrypto';
import { authDoctor } from '@/backend/middleware/authDoctor';

// Import all doctor controllers
import {
  loginDoctor,
  appointmentsDoctor,
  appointmentCancel,
  appointmentComplete,
  doctorDashboard,
  doctorProfile,
  updateDoctorProfile,
  doctorList
} from '@/backend/controllers/doctorController';

type ActionConfig = {
  controller: any;
  auth?: any;
};

// Map actions to controllers, with necessary middlewares applied
const actionMap: Record<string, ActionConfig> = {
  'login': { controller: loginDoctor },
  'appointments': { controller: appointmentsDoctor, auth: authDoctor },
  'cancel-appointment': { controller: appointmentCancel, auth: authDoctor },
  'complete-appointment': { controller: appointmentComplete, auth: authDoctor },
  'dashboard': { controller: doctorDashboard, auth: authDoctor },
  'profile': { controller: doctorProfile, auth: authDoctor },
  'update-profile': { controller: updateDoctorProfile, auth: authDoctor },
  'list': { controller: doctorList }
};

async function handleAction(request: NextRequest, context: { params: Promise<{ action: string }> }) {
  await connectDB();
  
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
