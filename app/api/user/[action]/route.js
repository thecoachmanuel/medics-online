import { NextResponse } from 'next/server';
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

// Map actions to controllers, with necessary middlewares applied
const actionMap = {
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

async function handleAction(request, context) {
  await connectDB();
  
  // App Router params logic (nextJS 15+ wait for params)
  const params = await context.params;
  const action = params.action;
  
  const routeConfig = actionMap[action];
  
  if (!routeConfig) {
    return NextResponse.json({ success: false, message: 'Route not found' }, { status: 404 });
  }

  // Create the final handler
  const finalHandler = async (req, ctx) => {
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
