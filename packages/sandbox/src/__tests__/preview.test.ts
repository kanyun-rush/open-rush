import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DEFAULT_PREVIEW_CONFIG, PreviewService } from '../preview.js';
import type { SandboxInfo, SandboxProvider } from '../provider.js';

class MockSandboxProvider implements SandboxProvider {
  healthy = true;
  endpointUrl: string | null = 'http://localhost:8000';

  async create() {
    return {
      id: 'sbx-1',
      status: 'running' as const,
      endpoint: 'http://localhost:8787',
      previewUrl: this.endpointUrl,
      createdAt: new Date(),
    };
  }

  async destroy() {}

  async getInfo(sandboxId: string): Promise<SandboxInfo | null> {
    return {
      id: sandboxId,
      status: 'running',
      endpoint: 'http://localhost:8787',
      previewUrl: this.endpointUrl,
      createdAt: new Date(),
    };
  }

  async healthCheck() {
    return this.healthy;
  }

  async getEndpointUrl(_sandboxId: string, _port: number) {
    return this.endpointUrl;
  }

  async exec() {
    return { stdout: '', stderr: '', exitCode: 0 };
  }
}

describe('PreviewService', () => {
  let provider: MockSandboxProvider;
  let service: PreviewService;

  beforeEach(() => {
    provider = new MockSandboxProvider();
    service = new PreviewService(provider);
  });

  describe('startDevServer', () => {
    it('starts dev server and returns URL', async () => {
      const status = await service.startDevServer('sbx-1');
      expect(status.running).toBe(true);
      expect(status.url).toBe('http://localhost:8000');
      expect(status.healthy).toBe(true);
    });

    it('returns not running when sandbox unhealthy', async () => {
      provider.healthy = false;
      const status = await service.startDevServer('sbx-1');
      expect(status.running).toBe(false);
      expect(status.url).toBeNull();
    });

    it('executes dev command', async () => {
      const execSpy = vi.spyOn(provider, 'exec');
      await service.startDevServer('sbx-1', 'pnpm dev');
      expect(execSpy).toHaveBeenCalledWith('sbx-1', 'pnpm dev');
    });
  });

  describe('getPreviewUrl', () => {
    it('returns endpoint URL for dev server port', async () => {
      const url = await service.getPreviewUrl('sbx-1');
      expect(url).toBe('http://localhost:8000');
    });

    it('returns null when no endpoint', async () => {
      provider.endpointUrl = null;
      const url = await service.getPreviewUrl('sbx-1');
      expect(url).toBeNull();
    });
  });

  describe('DEFAULT_PREVIEW_CONFIG', () => {
    it('has sensible defaults', () => {
      expect(DEFAULT_PREVIEW_CONFIG.devServerPort).toBe(8000);
      expect(DEFAULT_PREVIEW_CONFIG.healthCheckIntervalMs).toBe(2000);
      expect(DEFAULT_PREVIEW_CONFIG.maxStartupWaitMs).toBe(30000);
    });
  });
});
