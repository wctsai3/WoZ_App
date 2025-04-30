import { NextRequest, NextResponse } from 'next/server';
import redis from '@/lib/redis';
import { nanoid } from 'nanoid'; // Or use crypto.randomUUID

export const dynamic = 'force-dynamic';


export async function POST(req: NextRequest) {
  try {
    // Maybe expect questionnaire data instead of full session?
    // const questionnaireData = await req.json();
    // For now, assuming empty session creation triggered by form submit

    const newSessionId = nanoid(7); // Generate unique ID on the backend

    // Create the initial state for the new session
    const newSession = {
      id: newSessionId,
      customerProfile: null, // Profile will be generated later
      recommendations: [],
      feedback: [],
      moodboards: [],
      timestamp: Date.now(), // Add a timestamp
      // Add questionnaireData here if received from request
    };

    await redis.set(`session:${newSessionId}`, JSON.stringify(newSession));

    // *** FIX: Return the newly created session object ***
    return NextResponse.json(newSession);

  } catch (err) {
    console.error('Error creating session:', err);
    return NextResponse.json({ error: 'Failed to create session' }, { status: 500 });
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
