import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/backend/config/mongodb';
import { runExpressController } from '@/backend/utils/expressAdapter';
import { withEncryption } from '@/backend/middleware/hybridCrypto';
import { withUserAuth } from '@/backend/middleware/authUser';

// Import all user controllers
import {
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
} from '@/backend/controllers/userController';

type ActionConfig = {
  controller: any;
  auth?: any;
};

// Map actions to controllers, with necessary middlewares applied
const actionMap: Record<string, ActionConfig> = {
  'register': { controller: registerUser },
  'login': { controller: loginUser },
  'get-profile': { controller: getProfile, auth: withUserAuth },
  'update-profile': { controller: updateProfile, auth: withUserAuth },
  'book-appointment': { controller: bookAppointment, auth: withUserAuth },
  'appointments': { controller: listAppointment, auth: withUserAuth },
  'cancel-appointment': { controller: cancelAppointment, auth: withUserAuth },
  'reschedule-appointment': { controller: rescheduleAppointment, auth: withUserAuth },
  'payment-paystack': { controller: paymentPaystack, auth: withUserAuth },
  'verify-paystack': { controller: verifyPaystack, auth: withUserAuth }
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
