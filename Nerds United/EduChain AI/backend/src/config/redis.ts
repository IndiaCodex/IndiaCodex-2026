import Redis from 'ioredis';

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
const redis = new Redis(redisUrl, {
  maxRetriesPerRequest: null, // Required by BullMQ
});

redis.on('connect', () => {
  console.log('Successfully connected to Redis');
});

redis.on('error', (err) => {
  console.error('Redis connection error:', err);
});

export default redis;
export { redis };
