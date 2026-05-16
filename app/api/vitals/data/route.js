import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const body = await request.json();
    const { bpm, spo2 } = body;
    
    if (!bpm || !spo2) {
      return NextResponse.json({ success: false, message: 'Missing required fields' }, { status: 400 });
    }
    
    console.log(`📥 Vitals received - BPM: ${bpm}, SpO2: ${spo2}`);
    
    if (!global.vitalsData) {
      global.vitalsData = {
        latestRealVitals: null,
        lastUpdatedTime: Date.now(),
        MOCK_ENABLED: true
      };
    }
    
    global.vitalsData.latestRealVitals = { bpm, spo2, timestamp: Date.now() };
    global.vitalsData.lastUpdatedTime = Date.now();
    
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
