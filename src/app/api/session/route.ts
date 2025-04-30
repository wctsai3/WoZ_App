// app/api/session/route.ts
import { NextRequest, NextResponse } from 'next/server';
import redis from '@/lib/redis';

const SESSION_KEY = 'shared_woz_session';

export async function GET() {
  try {
    const data = await redis.get(SESSION_KEY);
    return NextResponse.json(data || {});
  } catch (error) {
    console.error('GET /api/session error:', error);
    return NextResponse.json({ error: 'Failed to load session' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    await redis.set(SESSION_KEY, body);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('POST /api/session error:', error);
    return NextResponse.json({ error: 'Failed to save session' }, { status: 500 });
  }
}
