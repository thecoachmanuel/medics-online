import { NextRequest, NextResponse } from 'next/server';
import appointmentModel from '@/backend/models/appointmentModel';

export async function POST(req: NextRequest) {
  try {
    const { meetingId, sender, text } = await req.json();

    if (!meetingId || !sender || !text) {
      return NextResponse.json({ success: false, message: 'Missing details' }, { status: 400 });
    }

    const appointment = await appointmentModel.findOneAndUpdate(
      { meetingId },
      { 
        $push: { 
          chatHistory: { 
            sender, 
            message: text, 
            timestamp: Date.now() 
          } 
        } 
      },
      { new: true }
    );

    if (!appointment) {
      return NextResponse.json({ success: false, message: 'Appointment not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, chatHistory: appointment.chatHistory });
  } catch (error: any) {
    console.error('Chat Send Error:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
