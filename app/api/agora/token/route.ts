import { NextRequest, NextResponse } from 'next/server';
import { RtcTokenBuilder, RtcRole } from 'agora-token';

export async function POST(req: NextRequest) {
  try {
    const { channelName, uid, role } = await req.json();

    const appId = process.env.AGORA_APP_ID;
    const appCertificate = process.env.AGORA_APP_CERTIFICATE;

    if (!appId || !appCertificate) {
      return NextResponse.json({ 
        success: false, 
        message: 'Agora configuration missing on server' 
      }, { status: 500 });
    }

    const expirationTimeInSeconds = 3600;
    const currentTimestamp = Math.floor(Date.now() / 1000);
    const privilegeExpiredTs = currentTimestamp + expirationTimeInSeconds;

    const agoraRole = role === 'publisher' ? RtcRole.PUBLISHER : RtcRole.SUBSCRIBER;

    const token = RtcTokenBuilder.buildTokenWithUid(
      appId,
      appCertificate,
      channelName,
      uid,
      agoraRole,
      privilegeExpiredTs,
      privilegeExpiredTs
    );

    return NextResponse.json({ success: true, token });
  } catch (error: any) {
    console.error('Agora Token Error:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
