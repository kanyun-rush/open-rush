import type { CreateSandboxOptions, SandboxInfo, SandboxProvider } from './provider.js';

export interface OpenSandboxConfig {
  apiUrl: string;
  apiToken?: string;
  defaultImage?: string;
}

export class OpenSandboxProvider implements SandboxProvider {
  constructor(private config: OpenSandboxConfig) {}

  async create(options: CreateSandboxOptions): Promise<SandboxInfo> {
    const response = await this.request('POST', '/sandboxes', {
      image: this.config.defaultImage ?? 'node:22-slim',
      env: options.env,
      ttl: options.ttlSeconds,
      labels: { agentId: options.agentId },
    });

    return {
      id: response.id,
      status: 'running',
      endpoint: response.endpoint ?? null,
      previewUrl: null,
      createdAt: new Date(),
    };
  }

  async destroy(sandboxId: string): Promise<void> {
    await this.request('DELETE', `/sandboxes/${sandboxId}`);
  }

  async getInfo(sandboxId: string): Promise<SandboxInfo | null> {
    try {
      const response = await this.request('GET', `/sandboxes/${sandboxId}`);
      return {
        id: response.id,
        status: response.status ?? 'running',
        endpoint: response.endpoint ?? null,
        previewUrl: response.previewUrl ?? null,
        createdAt: new Date(response.createdAt),
      };
    } catch {
      return null;
    }
  }

  async healthCheck(sandboxId: string): Promise<boolean> {
    try {
      const response = await this.request('GET', `/sandboxes/${sandboxId}/health`);
      return response.healthy === true;
    } catch {
      return false;
    }
  }

  async getEndpointUrl(sandboxId: string, port: number): Promise<string | null> {
    const info = await this.getInfo(sandboxId);
    if (!info?.endpoint) return null;
    return `${info.endpoint}:${port}`;
  }

  async exec(
    sandboxId: string,
    command: string
  ): Promise<{ stdout: string; stderr: string; exitCode: number }> {
    const response = await this.request('POST', `/sandboxes/${sandboxId}/exec`, { command });
    return {
      stdout: response.stdout ?? '',
      stderr: response.stderr ?? '',
      exitCode: response.exitCode ?? 0,
    };
  }

  private async request(
    method: string,
    path: string,
    body?: unknown
    // biome-ignore lint/suspicious/noExplicitAny: OpenSandbox API response is untyped
  ): Promise<Record<string, any>> {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (this.config.apiToken) {
      headers.Authorization = `Bearer ${this.config.apiToken}`;
    }

    const response = await fetch(`${this.config.apiUrl}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      throw new Error(`OpenSandbox API error: ${response.status} ${response.statusText}`);
    }

    if (response.status === 204) return {};
    return response.json() as Promise<Record<string, unknown>>;
  }
}
