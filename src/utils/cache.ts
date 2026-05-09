import Redis from 'ioredis';
import logger from './logger';

const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
  maxRetriesPerRequest: 1,
  retryStrategy: (times) => {
    if (times > 3) return null; // stop retrying after 3 times
    return Math.min(times * 50, 2000);
  },
  showFriendlyErrorStack: true
});

redis.on('connect', () => {
  logger.info('Connected to Redis for caching');
});

redis.on('error', (err: any) => {
  // Silent error unless it's a critical one
  if (err.code === 'ECONNREFUSED') {
    // Only log once or silently fail
    return;
  }
  logger.error('Redis connection error:', err);
});

export const getCachedData = async (key: string) => {
  try {
    const data = await redis.get(key);
    return data ? JSON.parse(data) : null;
  } catch (err) {
    logger.error(`Error getting cache for ${key}:`, err);
    return null;
  }
};

export const setCachedData = async (key: string, data: any, ttlSeconds = 3600) => {
  try {
    await redis.set(key, JSON.stringify(data), 'EX', ttlSeconds);
  } catch (err) {
    logger.error(`Error setting cache for ${key}:`, err);
  }
};

export const invalidateCache = async (key: string) => {
  try {
    await redis.del(key);
  } catch (err) {
    logger.error(`Error invalidating cache for ${key}:`, err);
  }
};

export default redis;
