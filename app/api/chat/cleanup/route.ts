import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/backend/config/mongodb';
import appointmentModel from '@/backend/models/appointmentModel';

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);

    const result = await appointmentModel.updateMany(
      { 'chatHistory.timestamp': { $lt: thirtyDaysAgo } },
      { $pull: { chatHistory: { timestamp: { $lt: thirtyDaysAgo } } } }
    );

    const completedResult = await appointmentModel.updateMany(
      { isCompleted: true, date: { $lt: thirtyDaysAgo } },
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
