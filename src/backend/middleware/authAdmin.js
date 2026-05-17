import jwt from 'jsonwebtoken';
import { NextResponse } from 'next/server';
import connectDB from '../config/mongodb.js';
import adminModel from '../models/adminModel.js';

export const withAdminAuth = (handler) => async (request, context) => {
  try {
    await connectDB();
    
    // Check headers - NextRequest headers are lowercase
    const aToken = request.headers.get('atoken') || request.atoken || request.aToken;
    
    if (!aToken) {
      return NextResponse.json({ success: false, message: 'Not Authorized Login Again' });
    }
    
    const token_decode = jwt.verify(aToken, process.env.JWT_SECRET);
    
    let admin = null;
    
    if (typeof token_decode === 'object' && token_decode !== null) {
      if (token_decode.id) {
        // Query dynamic database administrator
        admin = await adminModel.findById(token_decode.id);
      } else if (token_decode.email === process.env.ADMIN_EMAIL && token_decode.password === process.env.ADMIN_PASSWORD) {
        // Legacy fallback - seed or resolve Master Admin
        admin = await adminModel.findOne({ email: process.env.ADMIN_EMAIL.toLowerCase() });
        if (!admin) {
          const bcrypt = await import('bcrypt');
          const hashedPassword = await bcrypt.default.hash(process.env.ADMIN_PASSWORD, 10);
          admin = new adminModel({
            name: 'Master Admin',
            email: process.env.ADMIN_EMAIL.toLowerCase(),
            password: hashedPassword,
            role: 'master',
            permissions: {
              dashboard: true,
              appointments: true,
              doctors: true,
              patients: true,
              payouts: true,
              settings: true
            }
          });
          await admin.save();
        }
      }
    }
    
    if (!admin) {
      return NextResponse.json({ success: false, message: 'Not Authorized Login Again' });
    }
    
    if (!admin.isActive) {
      return NextResponse.json({ success: false, message: 'Your administrative account is suspended' });
    }
    
    // Attach dynamic admin variables to the request context
    request.admin = admin;
    request.adminId = admin._id.toString();
    
    // Call the original handler
    return handler(request, context);
  } catch (error) {
    console.error('withAdminAuth Middleware Error:', error);
    return NextResponse.json({ success: false, message: error.message || 'Authentication error' });
  }
};
