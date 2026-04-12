export interface SandboxInfo {
  id: string;
  status: 'creating' | 'running' | 'stopped' | 'destroyed';
  endpoint: string | null;
  previewUrl: string | null;
  createdAt: Date;
}

export interface CreateSandboxOptions {
  agentId: string;
  env?: Record<string, string>;
  workspaceMount?: string;
  ttlSeconds?: number;
}

export interface SandboxProvider {
  create(options: CreateSandboxOptions): Promise<SandboxInfo>;
  destroy(sandboxId: string): Promise<void>;
  getInfo(sandboxId: string): Promise<SandboxInfo | null>;
  healthCheck(sandboxId: string): Promise<boolean>;
  getEndpointUrl(sandboxId: string, port: number): Promise<string | null>;
  exec(
    sandboxId: string,
    command: string
  ): Promise<{ stdout: string; stderr: string; exitCode: number }>;
}
