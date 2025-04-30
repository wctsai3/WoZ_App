// app/api/session/route.ts
import { NextRequest, NextResponse } from 'next/server';
import redis from '@/lib/redis';

const SESSION_KEY = 'shared_woz_session';

export async function GET() {
  const data = await redis.get(SESSION_KEY);
  return NextResponse.json(data || {});
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  await redis.set(SESSION_KEY, body);
  return NextResponse.json({ success: true });
}
