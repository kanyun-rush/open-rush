import type { CreateSandboxOptions, SandboxInfo, SandboxProvider } from './provider.js';

export interface BatchSandboxConfig {
  poolSize: number;
  idleTimeoutMs: number;
  maxLifetimeMs: number;
  recycleCheckIntervalMs: number;
}

export const DEFAULT_BATCH_CONFIG: BatchSandboxConfig = {
  poolSize: 5,
  idleTimeoutMs: 300_000,
  maxLifetimeMs: 3_600_000,
  recycleCheckIntervalMs: 60_000,
};

interface PooledSandbox {
  info: SandboxInfo;
  lastUsedAt: number;
  createdAt: number;
  inUse: boolean;
}

export class BatchSandboxPool {
  private pool: PooledSandbox[] = [];

  constructor(
    private provider: SandboxProvider,
    private config: BatchSandboxConfig = DEFAULT_BATCH_CONFIG
  ) {}

  async warmup(options: Omit<CreateSandboxOptions, 'agentId'>): Promise<number> {
    const toCreate = this.config.poolSize - this.pool.filter((p) => !p.inUse).length;
    let created = 0;

    for (let i = 0; i < toCreate; i++) {
      const info = await this.provider.create({ ...options, agentId: `pool-${Date.now()}-${i}` });
      this.pool.push({
        info,
        lastUsedAt: Date.now(),
        createdAt: Date.now(),
        inUse: false,
      });
      created++;
    }

    return created;
  }

  async acquire(agentId: string): Promise<SandboxInfo | null> {
    const available = this.pool.find((p) => !p.inUse);
    if (!available) return null;

    available.inUse = true;
    available.lastUsedAt = Date.now();
    return available.info;
  }

  release(sandboxId: string): void {
    const pooled = this.pool.find((p) => p.info.id === sandboxId);
    if (pooled) {
      pooled.inUse = false;
      pooled.lastUsedAt = Date.now();
    }
  }

  async recycleIdle(): Promise<number> {
    const now = Date.now();
    let recycled = 0;

    for (let i = this.pool.length - 1; i >= 0; i--) {
      const pooled = this.pool[i];
      const isIdle = !pooled.inUse && now - pooled.lastUsedAt > this.config.idleTimeoutMs;
      const isExpired = now - pooled.createdAt > this.config.maxLifetimeMs;

      if (isIdle || isExpired) {
        await this.provider.destroy(pooled.info.id);
        this.pool.splice(i, 1);
        recycled++;
      }
    }

    return recycled;
  }

  getStats(): { total: number; inUse: number; available: number } {
    const inUse = this.pool.filter((p) => p.inUse).length;
    return {
      total: this.pool.length,
      inUse,
      available: this.pool.length - inUse,
    };
  }
}
