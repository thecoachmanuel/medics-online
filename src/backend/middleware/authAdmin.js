import jwt from 'jsonwebtoken';
import { NextResponse } from 'next/server';

export const withAdminAuth = (handler) => async (request, context) => {
  try {
    // Check headers - NextRequest headers are lowercase
    // Note: If using hybrid encryption, the decrypted token might be attached directly to the request object
    const aToken = request.headers.get('atoken') || request.atoken || request.aToken;
    
    if (!aToken) {
      return NextResponse.json({ success: false, message: 'Not Authorized Login Again' });
    }
    
    const token_decode = jwt.verify(aToken, process.env.JWT_SECRET);
    
    let isAuthorized = false;
    if (typeof token_decode === 'object' && token_decode !== null) {
      isAuthorized = token_decode.email === process.env.ADMIN_EMAIL && 
                    token_decode.password === process.env.ADMIN_PASSWORD;
    } else {
      isAuthorized = token_decode === process.env.ADMIN_EMAIL + process.env.ADMIN_PASSWORD;
    }

    if (!isAuthorized) {
      return NextResponse.json({ success: false, message: 'Not Authorized Login Again' });
    }
    
    // Call the original handler
    return handler(request, context);
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message });
  }
};
