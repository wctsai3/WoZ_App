import { NextRequest, NextResponse } from 'next/server';
import redis from '@/lib/redis';

const SESSION_PREFIX = 'session:';

export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get('id');

  if (id) {
    const session = await redis.get(`${SESSION_PREFIX}${id}`);
    return NextResponse.json(session || {});
  }

  const keys = await redis.keys(`${SESSION_PREFIX}*`);
  const sessions = await Promise.all(keys.map(key => redis.get(key)));
  return NextResponse.json(sessions.filter(Boolean));
}

export async function POST(req: NextRequest) {
  const session = await req.json();
  if (!session?.id) {
    return NextResponse.json({ error: 'Missing session id' }, { status: 400 });
  }

  await redis.set(`${SESSION_PREFIX}${session.id}`, session);
  return NextResponse.json({ success: true });
}
