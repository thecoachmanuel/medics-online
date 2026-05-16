import { NextResponse } from 'next/server';
import { DiffieHellman } from '@/backend/utils/crypto.js';

// Global store for DH instances (persists across Next.js API reloads in development)
if (!global.dhSessions) {
  global.dhSessions = new Map();
}

export async function GET(request) {
  const sessionId = request.headers.get('session-id') || 'default';
  console.log(`Providing public key for session: ${sessionId}`);
  
  if (!global.dhSessions.has(sessionId)) {
    const dh = new DiffieHellman();
    global.dhSessions.set(sessionId, dh);
    console.log(`🔑 Created new DH session: ${sessionId}`);
  }
  
  const dh = global.dhSessions.get(sessionId);
  console.log(`🔑 Using DH session: ${sessionId}`);
  
  return NextResponse.json({
    success: true,
    serverPublicKey: dh.getPublicKey(),
    sessionId: sessionId
  });
}
