import { NextRequest, NextResponse } from 'next/server';
import redis from '@/lib/redis';


export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const sessionId = params.id;

  if (!sessionId) {
    return NextResponse.json({ error: 'Session ID is required' }, { status: 400 });
  }

  try {
    const sessionData = await redis.get(`session:${sessionId}`);

    if (!sessionData) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }
    let parsedSession;
    try {
        if (typeof sessionData === 'string') {
            parsedSession = JSON.parse(sessionData);
        } else {
            parsedSession = sessionData;
        }

    } catch (parseError) {
        console.error('Error parsing session data from Redis:', parseError);
        return NextResponse.json({ error: 'Failed to parse session data' }, { status: 500 });
    }


    return NextResponse.json(parsedSession);

  } catch (err) {
    console.error(`Error fetching session ${sessionId} from Redis:`, err);
    return NextResponse.json({ error: 'Failed to load session' }, { status: 500 });
  }
}