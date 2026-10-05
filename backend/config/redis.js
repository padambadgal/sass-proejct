import { createClient } from 'redis';

let redisClient = null;

export const connectRedis = async () => {
  try {
    if (!process.env.REDIS_URL) {
      console.warn('⚠️  REDIS_URL not set. Redis cache disabled.');
      return null;
    }
    redisClient = createClient({ url: process.env.REDIS_URL });
    redisClient.on('error', (err) => console.error('Redis Client Error:', err));
    await redisClient.connect();
    console.log('✅ Redis Connected');
    return redisClient;
  } catch (error) {
    console.error('Redis connection failed:', error.message);
    return null;
  }
};

export const getRedis = () => redisClient;

// Helper: safe get/set with TTL
export const cacheGet = async (key) => {
  if (!redisClient) return null;
  try {
    const data = await redisClient.get(key);
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
};

export const cacheSet = async (key, value, ttlSeconds = 300) => {
  if (!redisClient) return;
  try {
    await redisClient.setEx(key, ttlSeconds, JSON.stringify(value));
  } catch (err) {
    console.error('Redis set error:', err.message);
  }
};

export const cacheDel = async (pattern) => {
  if (!redisClient) return;
  try {
    // pattern can contain * — use SCAN
    const keys = [];
    for await (const key of redisClient.scanIterator({ MATCH: pattern })) {
      keys.push(key);
    }
    if (keys.length > 0) await redisClient.del(keys);
  } catch (err) {
    console.error('Redis del error:', err.message);
  }
};