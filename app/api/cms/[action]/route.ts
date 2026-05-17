import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/backend/config/mongodb';
import connectCloudinary from '@/backend/config/cloudinary';
import { runExpressController } from '@/backend/utils/expressAdapter';
import { withEncryption } from '@/backend/middleware/hybridCrypto';
import { getCmsData } from '@/backend/controllers/cmsController';

type ActionConfig = {
  controller: any;
};

const actionMap: Record<string, ActionConfig> = {
  'get': { controller: getCmsData }
};

async function handleAction(request: NextRequest, context: { params: Promise<{ action: string }> }) {
  await connectDB();
  await connectCloudinary();
  
  const { action } = await context.params;
  const routeConfig = actionMap[action];
  
  if (!routeConfig) {
    return NextResponse.json({ success: false, message: 'Route not found' }, { status: 404 });
  }

  return await runExpressController(routeConfig.controller, request, context);
}

export const POST = withEncryption(handleAction);
export const GET = withEncryption(handleAction);
