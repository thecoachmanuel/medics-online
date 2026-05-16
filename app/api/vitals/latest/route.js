import { NextResponse } from 'next/server';
import { withEncryption } from '@/backend/middleware/hybridCrypto';

const generateRealisticVitals = () => {
  if (!global.vitalsData) return { bpm: '---', spo2: '---', timestamp: Date.now() };
  
  if (global.vitalsData.latestRealVitals && Date.now() - global.vitalsData.lastUpdatedTime < 30000) {
    return global.vitalsData.latestRealVitals;
  }
  const baseHeartRate = 82;
  const baseSpo2 = 98;
  const heartRateVariation = Math.floor(Math.random() * 8) - 3;
  const spo2Variation = Math.floor(Math.random() * 3) - 1;
  return {
    bpm: Math.max(60, Math.min(100, baseHeartRate + heartRateVariation)).toString(),
    spo2: Math.max(95, Math.min(100, baseSpo2 + spo2Variation)).toString(),
    timestamp: Date.now()
  };
};

async function handleGetVitals(request) {
  if (!global.vitalsData) {
    global.vitalsData = {
      latestRealVitals: null,
      lastUpdatedTime: Date.now(),
      MOCK_ENABLED: true
    };
  }

  let vitals = global.vitalsData.MOCK_ENABLED ? generateRealisticVitals() : global.vitalsData.latestRealVitals;
  
  if (!vitals) {
    return NextResponse.json({ success: false, message: 'No vitals data available' }, { status: 404 });
  }

  return NextResponse.json({ success: true, ...vitals });
}

export const GET = withEncryption(handleGetVitals);
export const POST = withEncryption(handleGetVitals);
