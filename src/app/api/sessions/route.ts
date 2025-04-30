import { NextRequest, NextResponse } from 'next/server';
import redis from '@/lib/redis';

export const dynamic = 'force-dynamic';


export async function POST(req: NextRequest) {
  try {
    const session = await req.json();

    if (!session || !session.id) {
      return NextResponse.json({ error: 'Session must include an ID' }, { status: 400 });
    }

    await redis.set(`session:${session.id}`, JSON.stringify(session));

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Error saving session to Redis:', err);
    return NextResponse.json({ error: 'Failed to save session' }, { status: 500 });
  }
}

export async function GET() {
    try {
      const keys = await redis.keys('session:*');
      if (!keys || keys.length === 0) {
        return NextResponse.json([]);
      }

      
      const sessions = await redis.mget(...keys);
      const parsed = sessions
        .map((s) => {
          try {
            return typeof s === 'string' ? JSON.parse(s) : s;
          } catch {
            return null;
          }
        })
        .filter((s) => s && s.id);
  
      return NextResponse.json(parsed);
    } catch (err) {
      console.error('Error fetching sessions:', err);
      return NextResponse.json({ error: 'Failed to load sessions' }, { status: 500 });
    }
}
