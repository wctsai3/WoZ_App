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
    const sessionKey = `session:${newSessionId}`;

    // Create the initial state for the new session
    const newSession = {
      id: newSessionId,
      customerProfile: null, // Profile will be generated later
      recommendations: [],
      feedback: [],
      moodboards: [],
      timestamp: Date.now(), 
      questionnaire: body.questionnaire // Store the questionnaire data
    };

    // Store as JSON string in Redis
    await redis.set(sessionKey, JSON.stringify(newSession));

    console.log(`Created new session: ${newSessionId}`);
    
    // Return the newly created session object
    return NextResponse.json(newSession);

  } catch (err) {
    console.error('Error creating session:', err);
    return NextResponse.json({ error: 'Failed to create session', details: err.message }, { status: 500 });
  }
}

// GET handler to retrieve all sessions - accessible to everyone
export async function GET() {
    try {
      // Get all session keys
      const keys = await redis.keys('session:*');
      
      if (!keys || keys.length === 0) {
        return NextResponse.json([]);
      }
      
      // Get all sessions data
      const sessions = await redis.mget(...keys);
      
      // Parse session data
      const parsed = sessions
        .map((s) => {
          try {
            // Handle if Upstash returns a parsed object or a string
            if (typeof s === 'object' && s !== null) return s;
            return typeof s === 'string' ? JSON.parse(s) : s;
          } catch (e) {
            console.error('Error parsing session data:', e);
            return null;
          }
        })
        .filter((s) => s && s.id);
  
      return NextResponse.json(parsed);
    } catch (err) {
      console.error('Error fetching sessions:', err);
      return NextResponse.json({ error: 'Failed to load sessions', details: err.message }, { status: 500 });
    }
}