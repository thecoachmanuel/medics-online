import { NextResponse } from 'next/server';
import { DiffieHellman, encrypt, decrypt } from '../utils/crypto.js';

// Global store for DH instances (persists across Next.js API reloads in development)
if (!global.dhSessions) {
  global.dhSessions = new Map();
}

/**
 * Middleware wrapper for Diffie-Hellman encrypted Next.js API Routes.
 * This handles:
 * 1. Decrypting the incoming request.
 * 2. Invoking the actual route handler.
 * 3. Encrypting the response back.
 */
export const withEncryption = (handler) => async (request, context) => {
  try {
    // Determine if request is POST (which might have body)
    const method = request.method;
    let body = null;
    let isEncrypted = false;
    let sharedSecret = null;
    let originalHeaders = {};

    const sessionId = request.headers.get('session-id');

    // Attempt to parse JSON body if applicable
    if (method === 'POST' || method === 'PUT' || method === 'PATCH') {
      try {
        body = await request.json();
        // Cache the parsed body so it can be reused without "body already consumed" errors
        request.parsedBody = body;
      } catch (e) {
        // Body might be empty or invalid, ignore
      }
    }

    if (body && body.encrypted && body.clientPublicKey) {
      console.log(`🔓 Attempting decryption for session: ${sessionId}`);
      console.log(`🔓 Client public key: ${body.clientPublicKey}`);

      if (!sessionId) {
        console.error('❌ No session ID provided for encrypted request');
        return NextResponse.json({ success: false, message: 'Session ID required for encrypted requests' }, { status: 400 });
      }

      // Reconstruct the SAME DH instance using the sessionId as seed
      const dh = new DiffieHellman(sessionId);

      console.log(`🔓 Server public key: ${dh.getPublicKey()}`);
      sharedSecret = dh.generateSharedSecret(body.clientPublicKey);
      console.log(`🔓 Generated shared secret: ${sharedSecret}`);

      const decryptedData = decrypt(body.encrypted, sharedSecret);
      console.log(`🔓 Decrypted data:`, decryptedData);

      // Extract headers from decrypted payload
      if (decryptedData && decryptedData.headers) {
        originalHeaders = { ...decryptedData.headers };
        console.log('🔓 Headers extracted from encrypted request:', originalHeaders);
        delete decryptedData.headers;
      }

      // We attach the decrypted payload to the request object so the handler can read it
      request.decryptedBody = decryptedData;
      isEncrypted = true;

      // We also inject headers into the request object since NextRequest headers are read-only
      for (const [key, value] of Object.entries(originalHeaders)) {
        request[key.toLowerCase()] = value;
      }
    }

    // Call the original Next.js Route Handler
    const response = await handler(request, context);

    // If it was encrypted, encrypt the response
    if (isEncrypted && sharedSecret && response.ok) {
      const data = await response.json();
      const encrypted = encrypt(data, sharedSecret);
      console.log('🔐 Response encrypted successfully');
      return NextResponse.json({ success: true, encrypted });
    }

    // Otherwise, return normal response
    return response;
  } catch (error) {
    console.error('❌ Encryption Middleware Error:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
};