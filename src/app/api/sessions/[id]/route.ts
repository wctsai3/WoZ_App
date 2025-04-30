import { NextRequest, NextResponse } from 'next/server';
import redis from '@/lib/redis';

export const dynamic = 'force-dynamic';

// Get a specific session by ID
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const id = params.id;

  try {
    const result = await redis.get(`session:${id}`);
    
    if (!result) {
      return NextResponse.json(
        { error: `Session ${id} not found` },
        { status: 404 }
      );
    }

    const session = JSON.parse(result);
    return NextResponse.json(session);
  } catch (err) {
    console.error(`Error fetching session ${id}:`, err);
    return NextResponse.json(
      { error: 'Failed to fetch session' },
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
  
  try {
    // Check if session exists first
    const exists = await redis.exists(`session:${id}`);
    
    if (!exists) {
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
    
    return NextResponse.json({ success: true, id });
  } catch (err) {
    console.error(`Error updating session ${id}:`, err);
    return NextResponse.json(
      { error: 'Failed to update session' },
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
  
  try {
    const result = await redis.del(`session:${id}`);
    
    if (result === 0) {
      return NextResponse.json(
        { error: `Session ${id} not found` },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ success: true, id });
  } catch (err) {
    console.error(`Error deleting session ${id}:`, err);
    return NextResponse.json(
      { error: 'Failed to delete session' },
      { status: 500 }
    );
  }
}