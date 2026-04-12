import { describe, expect, it, vi } from 'vitest';
import { type RedisClient, RedisRateLimiter } from '../redis-rate-limiter.js';

class MockRedis implements RedisClient {
  private sets = new Map<string, number[]>();

  async eval(_script: string, _numkeys: number, ...args: (string | number)[]): Promise<unknown> {
    const key = String(args[0]);
    const limit = Number(args[1]);
    const window = Number(args[2]);
    const now = Number(args[3]);

    let timestamps = this.sets.get(key) ?? [];
    timestamps = timestamps.filter((ts) => ts > now - window);
    this.sets.set(key, timestamps);

    if (timestamps.length < limit) {
      timestamps.push(now);
      return 1;
    }
    return 0;
  }
}

describe('RedisRateLimiter', () => {
  it('allows requests within limit', async () => {
    const redis = new MockRedis();
    const limiter = new RedisRateLimiter(redis, { maxRequestsPerMinute: 3 });

    expect(await limiter.tryAcquire('user-1')).toBe(true);
    expect(await limiter.tryAcquire('user-1')).toBe(true);
    expect(await limiter.tryAcquire('user-1')).toBe(true);
  });

  it('blocks when limit exceeded', async () => {
    const redis = new MockRedis();
    const limiter = new RedisRateLimiter(redis, { maxRequestsPerMinute: 2 });

    expect(await limiter.tryAcquire('user-1')).toBe(true);
    expect(await limiter.tryAcquire('user-1')).toBe(true);
    expect(await limiter.tryAcquire('user-1')).toBe(false);
  });

  it('isolates by identifier', async () => {
    const redis = new MockRedis();
    const limiter = new RedisRateLimiter(redis, { maxRequestsPerMinute: 1 });

    expect(await limiter.tryAcquire('user-1')).toBe(true);
    expect(await limiter.tryAcquire('user-2')).toBe(true);
    expect(await limiter.tryAcquire('user-1')).toBe(false);
  });

  it('uses custom key prefix', async () => {
    const redis = new MockRedis();
    const evalSpy = vi.spyOn(redis, 'eval');
    const limiter = new RedisRateLimiter(redis, { maxRequestsPerMinute: 10, keyPrefix: 'custom' });

    await limiter.tryAcquire('test');
    expect(String(evalSpy.mock.calls[0][2])).toContain('custom:test');
  });
});
