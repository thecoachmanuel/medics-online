import { NextRequest, NextResponse } from 'next/server';
import appointmentModel from '@/backend/models/appointmentModel';

// GET /api/chat/cleanup — Clears chat history older than 30 days
// Can be triggered by a Vercel Cron Job or external scheduler
export async function GET(req: NextRequest) {
  try {
    // Verify cron secret to prevent unauthorized access
    const authHeader = req.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);

    // Remove chat messages older than 30 days from all appointments
    const result = await appointmentModel.updateMany(
      { 'chatHistory.timestamp': { $lt: thirtyDaysAgo } },
      { $pull: { chatHistory: { timestamp: { $lt: thirtyDaysAgo } } } }
    );

    // Also clear entire chatHistory for appointments completed more than 30 days ago
    const completedResult = await appointmentModel.updateMany(
      { 
        isCompleted: true, 
        date: { $lt: thirtyDaysAgo } 
      },
      { $set: { chatHistory: [] } }
    );

    return NextResponse.json({ 
      success: true, 
      message: 'Chat history cleanup complete',
      modifiedMessages: result.modifiedCount,
      modifiedCompleted: completedResult.modifiedCount
    });
  } catch (error: any) {
    console.error('Chat Cleanup Error:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
