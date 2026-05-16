import jwt from 'jsonwebtoken';
import { NextResponse } from 'next/server';

export const withAdminAuth = (handler) => async (request, context) => {
  try {
    // Check headers - NextRequest headers are lowercase
    // Note: If using hybrid encryption, the decrypted token might be attached directly to the request object
    const aToken = request.headers.get('atoken') || request.atoken;
    
    if (!aToken) {
      return NextResponse.json({ success: false, message: 'Not Authorized Login Again' });
    }
    
    const token_decode = jwt.verify(aToken, process.env.JWT_SECRET);
    
    if (token_decode !== process.env.ADMIN_EMAIL + process.env.ADMIN_PASSWORD) {
      return NextResponse.json({ success: false, message: 'Not Authorized Login Again' });
    }
    
    // Call the original handler
    return handler(request, context);
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message });
  }
};
