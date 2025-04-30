import { Redis } from '@upstash/redis';

// Initialize Redis client using environment variables
const redis = Redis.fromEnv();

// Enhanced Redis client with error handling
const enhancedRedis = {
  async get(key: string) {
    try {
      return await redis.get(key);
    } catch (error) {
      console.error(`Redis GET error for key ${key}:`, error);
      throw error;
    }
  },
  
  async set(key: string, value: string) {
    try {
      return await redis.set(key, value);
    } catch (error) {
      console.error(`Redis SET error for key ${key}:`, error);
      throw error;
    }
  },
  
  async del(key: string) {
    try {
      return await redis.del(key);
    } catch (error) {
      console.error(`Redis DEL error for key ${key}:`, error);
      throw error;
    }
  },
  
  async exists(key: string) {
    try {
      const value = await redis.exists(key);
      return value === 1;
    } catch (error) {
      console.error(`Redis EXISTS error for key ${key}:`, error);
      throw error;
    }
  },
  
  async keys(pattern: string) {
    try {
      return await redis.keys(pattern);
    } catch (error) {
      console.error(`Redis KEYS error for pattern ${pattern}:`, error);
      throw error;
    }
  },
  
  async mget(...keys: string[]) {
    try {
      return await redis.mget(...keys);
    } catch (error) {
      console.error(`Redis MGET error:`, error);
      throw error;
    }
  },
  
  // Health check method
  async ping() {
    try {
      return await redis.ping();
    } catch (error) {
      console.error('Redis PING error:', error);
      throw error;
    }
  }
};

export default enhancedRedis;