import { NextResponse } from 'next/server';
import redis from '@/lib/redis';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Test Redis connection
    const pingResult = await redis.ping();
    
    if (pingResult !== 'PONG') {
      return NextResponse.json({
        status: 'error',
        redis: 'connection failed',
        message: `Expected PONG, got ${pingResult}`
      }, { status: 500 });
    }
    
    // Test Redis operations
    const testKey = 'health-check-test';
    const testValue = 'working';
    
    // Set a test value
    await redis.set(testKey, testValue);
    
    // Get the test value
    const retrievedValue = await redis.get(testKey);
    
    // Clean up
    await redis.del(testKey);
    
    if (retrievedValue !== testValue) {
      return NextResponse.json({
        status: 'error',
        redis: 'operations failed',
        message: `Set "${testValue}" but got "${retrievedValue}"`
      }, { status: 500 });
    }
    
    // All checks passed
    return NextResponse.json({
      status: 'healthy',
      redis: 'connected',
      timestamp: new Date().toISOString(),
      env: {
        hasRedisUrl: !!process.env.UPSTASH_REDIS_REST_URL,
        hasRedisToken: !!process.env.UPSTASH_REDIS_REST_TOKEN
      }
    });
    
  } catch (error) {
    console.error('Health check failed:', error);
    
    return NextResponse.json({
      status: 'error',
      message: error.message || 'Unknown error',
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      env: {
        hasRedisUrl: !!process.env.UPSTASH_REDIS_REST_URL,
        hasRedisToken: !!process.env.UPSTASH_REDIS_REST_TOKEN
      }
    }, { status: 500 });
  }
}