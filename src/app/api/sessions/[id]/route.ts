import { NextRequest, NextResponse } from 'next/server';
import redis from '@/lib/redis';

export const dynamic = 'force-dynamic';

// Get a specific session by ID
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const id = params.id;
  console.log(`Fetching session with ID: ${id}`);

  try {
    // First check if the session exists
    const exists = await redis.exists(`session:${id}`);
    
    if (!exists) {
      console.log(`Session ${id} not found in Redis`);
      return NextResponse.json(
        { error: `Session ${id} not found` },
        { status: 404 }
      );
    }

    // Get the session data
    const result = await redis.get(`session:${id}`);
    
    if (!result) {
      console.log(`Session ${id} exists but returned null/empty data`);
      return NextResponse.json(
        { error: `Session ${id} data is empty` },
        { status: 404 }
      );
    }

    try {
      // Attempt to parse the session data
      const session = JSON.parse(result);
      console.log(`Successfully retrieved session ${id}`);
      return NextResponse.json(session);
    } catch (parseError) {
      console.error(`Error parsing session data for ${id}:`, parseError);
      return NextResponse.json(
        { error: `Invalid session data format for ${id}` },
        { status: 500 }
      );
    }
  } catch (err) {
    console.error(`Error fetching session ${id} from Redis:`, err);
    return NextResponse.json(
      { error: 'Failed to fetch session from database', details: err.message },
      { status: 500 }
    );
  }
}

// Update a specific session
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const id = params.id;
  console.log(`Updating session with ID: ${id}`);
  
  try {
    // Check if session exists first
    const exists = await redis.exists(`session:${id}`);
    
    if (!exists) {
      console.log(`Session ${id} not found for update`);
      return NextResponse.json(
        { error: `Session ${id} not found` },
        { status: 404 }
      );
    }
    
    // Get the updated data from request body
    const updateData = await req.json();
    
    // Ensure the ID in the data matches the URL parameter
    if (updateData.id !== id) {
      updateData.id = id; // Enforce ID match
    }
    
    // Save the updated session data
    await redis.set(`session:${id}`, JSON.stringify(updateData));
    console.log(`Successfully updated session ${id}`);
    
    return NextResponse.json({ success: true, id });
  } catch (err) {
    console.error(`Error updating session ${id}:`, err);
    return NextResponse.json(
      { error: 'Failed to update session', details: err.message },
      { status: 500 }
    );
  }
}

// Delete a specific session
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const id = params.id;
  console.log(`Deleting session with ID: ${id}`);
  
  try {
    const result = await redis.del(`session:${id}`);
    
    if (result === 0) {
      console.log(`Session ${id} not found for deletion`);
      return NextResponse.json(
        { error: `Session ${id} not found` },
        { status: 404 }
      );
    }
    
    console.log(`Successfully deleted session ${id}`);
    return NextResponse.json({ success: true, id });
  } catch (err) {
    console.error(`Error deleting session ${id}:`, err);
    return NextResponse.json(
      { error: 'Failed to delete session', details: err.message },
      { status: 500 }
    );
  }
}