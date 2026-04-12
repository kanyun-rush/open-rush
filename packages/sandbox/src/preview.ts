import type { SandboxProvider } from './provider.js';

export interface PreviewConfig {
  devServerPort: number;
  healthCheckPath: string;
  healthCheckIntervalMs: number;
  healthCheckTimeoutMs: number;
  maxStartupWaitMs: number;
}

export const DEFAULT_PREVIEW_CONFIG: PreviewConfig = {
  devServerPort: 8000,
  healthCheckPath: '/',
  healthCheckIntervalMs: 2000,
  healthCheckTimeoutMs: 5000,
  maxStartupWaitMs: 30000,
};

export interface PreviewStatus {
  running: boolean;
  url: string | null;
  healthy: boolean;
  startedAt: Date | null;
}

export class PreviewService {
  constructor(
    private provider: SandboxProvider,
    private config: PreviewConfig = DEFAULT_PREVIEW_CONFIG
  ) {}

  async startDevServer(sandboxId: string, command = 'npm run dev'): Promise<PreviewStatus> {
    const healthy = await this.provider.healthCheck(sandboxId);
    if (!healthy) {
      return { running: false, url: null, healthy: false, startedAt: null };
    }

    await this.provider.exec(sandboxId, command);

    const url = await this.provider.getEndpointUrl(sandboxId, this.config.devServerPort);

    return {
      running: true,
      url,
      healthy: true,
      startedAt: new Date(),
    };
  }

  async waitForReady(sandboxId: string): Promise<boolean> {
    const startTime = Date.now();

    while (Date.now() - startTime < this.config.maxStartupWaitMs) {
      const url = await this.provider.getEndpointUrl(sandboxId, this.config.devServerPort);
      if (url) {
        try {
          const response = await fetch(`${url}${this.config.healthCheckPath}`, {
            signal: AbortSignal.timeout(this.config.healthCheckTimeoutMs),
          });
          if (response.ok) return true;
        } catch {
          // Not ready yet
        }
      }
      await new Promise((resolve) => setTimeout(resolve, this.config.healthCheckIntervalMs));
    }

    return false;
  }

  async getPreviewUrl(sandboxId: string): Promise<string | null> {
    return this.provider.getEndpointUrl(sandboxId, this.config.devServerPort);
  }
}
