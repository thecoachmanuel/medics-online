import jwt from 'jsonwebtoken';
import { NextResponse } from 'next/server';

// user authentication middleware wrapper
export const withUserAuth = (handler) => async (request, context) => {
  try {
    const token = request.headers.get('token') || request.token;
    
    if (!token) {
      return NextResponse.json({ success: false, message: 'Not Authorized Login Again' });
    }
    
    const token_decode = jwt.verify(token, process.env.JWT_SECRET);
    
    // Inject userId into the request object for the handler to use
    request.userId = token_decode.id;
    
    return handler(request, context);
  } catch (error) {
    console.log(error);
    return NextResponse.json({ success: false, message: error.message });
  }
};
