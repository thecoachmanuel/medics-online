import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/backend/config/mongodb';
import { runExpressController } from '@/backend/utils/expressAdapter';
import { withEncryption } from '@/backend/middleware/hybridCrypto';
import { authAdmin } from '@/backend/middleware/authAdmin';

// Import all admin controllers
import {
  addDoctor,
  loginAdmin,
  allDoctors,
  appointmentsAdmin,
  appointmentCancel,
  adminDashboard
} from '@/backend/controllers/adminController';

import { changeAvailablity } from '@/backend/controllers/doctorController';

type ActionConfig = {
  controller: any;
  auth?: any;
};

// Map actions to controllers, with necessary middlewares applied
const actionMap: Record<string, ActionConfig> = {
  'login': { controller: loginAdmin },
  'add-doctor': { controller: addDoctor, auth: authAdmin },
  'all-doctors': { controller: allDoctors, auth: authAdmin },
  'appointments': { controller: appointmentsAdmin, auth: authAdmin },
  'cancel-appointment': { controller: appointmentCancel, auth: authAdmin },
  'dashboard': { controller: adminDashboard, auth: authAdmin },
  'change-availability': { controller: changeAvailablity, auth: authAdmin }
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
