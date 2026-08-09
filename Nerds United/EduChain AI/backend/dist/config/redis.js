"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.redis = void 0;
const ioredis_1 = __importDefault(require("ioredis"));
const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
const redis = new ioredis_1.default(redisUrl, {
    maxRetriesPerRequest: null, // Required by BullMQ
});
exports.redis = redis;
redis.on('connect', () => {
    console.log('Successfully connected to Redis');
});
redis.on('error', (err) => {
    console.error('Redis connection error:', err);
});
exports.default = redis;
