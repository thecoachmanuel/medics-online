import jwt from 'jsonwebtoken';
import { NextResponse } from 'next/server';

// doctor authentication middleware wrapper
export const withDoctorAuth = (handler) => async (request, context) => {
  try {
    const dToken = request.headers.get('dtoken') || request.dtoken || request.dToken;
    
    if (!dToken) {
      return NextResponse.json({ success: false, message: 'Not Authorized Login Again' });
    }
    
    const token_decode = jwt.verify(dToken, process.env.JWT_SECRET);
    
    // Inject docId into the request object for the handler to use
    request.docId = token_decode.id;
    
    return handler(request, context);
  } catch (error) {
    console.log(error);
    return NextResponse.json({ success: false, message: error.message });
  }
};
