export interface RedisRateLimiterConfig {
  maxRequestsPerMinute: number;
  keyPrefix?: string;
}

export interface RedisClient {
  eval(script: string, numkeys: number, ...args: (string | number)[]): Promise<unknown>;
}

const SLIDING_WINDOW_SCRIPT = `
local key = KEYS[1]
local limit = tonumber(ARGV[1])
local window = tonumber(ARGV[2])
local now = tonumber(ARGV[3])
local clearBefore = now - window
redis.call('ZREMRANGEBYSCORE', key, 0, clearBefore)
local count = redis.call('ZCARD', key)
if count < limit then
  redis.call('ZADD', key, now, now .. '-' .. math.random(1000000))
  redis.call('EXPIRE', key, window / 1000 + 1)
  return 1
else
  return 0
end
`;

export class RedisRateLimiter {
  private keyPrefix: string;
  private windowMs = 60_000;

  constructor(
    private redis: RedisClient,
    private config: RedisRateLimiterConfig
  ) {
    this.keyPrefix = config.keyPrefix ?? 'rate_limit';
  }

  async tryAcquire(identifier: string): Promise<boolean> {
    const key = `${this.keyPrefix}:${identifier}`;
    const now = Date.now();
    const result = await this.redis.eval(
      SLIDING_WINDOW_SCRIPT,
      1,
      key,
      this.config.maxRequestsPerMinute,
      this.windowMs,
      now
    );
    return result === 1;
  }
}
