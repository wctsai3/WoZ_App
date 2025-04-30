import { NextRequest, NextResponse } from 'next/server';
import redis from '@/lib/redis';
import { nanoid } from 'nanoid'; // Or use crypto.randomUUID

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    // Only create a new session if there's questionnaire data
    if (!body || !body.questionnaire) {
      return NextResponse.json(
        { error: 'Missing questionnaire data' },
        { status: 400 }
      );
    }

    const newSessionId = nanoid(7); // Generate unique ID on the backend

    // Create the initial state for the new session
    const newSession = {
      id: newSessionId,
      customerProfile: null, // Profile will be generated later
      recommendations: [],
      feedback: [],
      moodboards: [],
      timestamp: Date.now(), // Add a timestamp
      questionnaire: body.questionnaire // Store the questionnaire data
    };

    await redis.set(`session:${newSessionId}`, JSON.stringify(newSession));

    console.log(`Created new session: ${newSessionId}`);
    
    // Return the newly created session object
    return NextResponse.json(newSession);

  } catch (err) {
    console.error('Error creating session:', err);
    return NextResponse.json({ error: 'Failed to create session' }, { status: 500 });
  }
}

// GET handler to retrieve all sessions - accessible to everyone
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