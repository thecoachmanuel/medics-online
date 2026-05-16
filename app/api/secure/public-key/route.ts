import { NextRequest, NextResponse } from 'next/server';
import { DiffieHellman } from '@/backend/utils/crypto.js';

// Global store for DH instances (persists across Next.js API reloads in development)
if (!global.dhSessions) {
  global.dhSessions = new Map();
}

export async function GET(request: NextRequest) {
  const sessionId = request.headers.get('session-id') || 'default';
  console.log(`Providing deterministic public key for session: ${sessionId}`);
  
  // Deterministic DH based on sessionId - works across serverless instances
  const dh = new DiffieHellman(sessionId);
  
  return NextResponse.json({
    success: true,
    serverPublicKey: dh.getPublicKey(),
    sessionId: sessionId
  });
}
