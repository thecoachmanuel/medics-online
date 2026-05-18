import jwt from 'jsonwebtoken';
import { NextResponse } from 'next/server';
import doctorModel from '../models/doctorModel.js';

// doctor authentication middleware wrapper
export const withDoctorAuth = (handler) => async (request, context) => {
  try {
    const dToken = request.headers.get('dtoken') || request.dtoken || request.dToken;
    
    if (!dToken) {
      return NextResponse.json({ success: false, message: 'Not Authorized Login Again' });
    }
    
    const token_decode = jwt.verify(dToken, process.env.JWT_SECRET);
    
    // Verify doctor exists in the database
    const doctor = await doctorModel.findById(token_decode.id);
    if (!doctor) {
      return NextResponse.json({ success: false, message: 'Account not found or deleted' });
    }
    
    // Inject docId into the request object for the handler to use
    request.docId = token_decode.id;
    
    return handler(request, context);
  } catch (error) {
    console.log(error);
    return NextResponse.json({ success: false, message: error.message });
  }
};
