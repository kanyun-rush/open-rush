export type ConnectionMode = 'anthropic' | 'bedrock' | 'custom';

export interface ClaudeCodeConfig {
  connectionMode: ConnectionMode;
  model?: string;
  apiKey?: string;
  awsRegion?: string;
  awsAccessKeyId?: string;
  awsSecretAccessKey?: string;
  customEndpoint?: string;
  maxTurnTokens?: number;
  timeoutMs?: number;
}

export interface ClaudeCodeResult {
  output: string;
  exitCode: number;
  tokensUsed?: number;
}

export function buildEnvVars(config: ClaudeCodeConfig): Record<string, string> {
  const env: Record<string, string> = {};

  if (config.connectionMode === 'bedrock') {
    env.CLAUDE_CODE_USE_BEDROCK = '1';
    if (config.awsRegion) env.AWS_REGION = config.awsRegion;
    if (config.awsAccessKeyId) env.AWS_ACCESS_KEY_ID = config.awsAccessKeyId;
    if (config.awsSecretAccessKey) env.AWS_SECRET_ACCESS_KEY = config.awsSecretAccessKey;
    if (config.model) env.ANTHROPIC_MODEL = config.model;
  } else if (config.connectionMode === 'anthropic') {
    if (config.apiKey) env.ANTHROPIC_API_KEY = config.apiKey;
    if (config.model) env.ANTHROPIC_MODEL = config.model;
  } else if (config.connectionMode === 'custom') {
    if (config.customEndpoint) env.ANTHROPIC_BASE_URL = config.customEndpoint;
    if (config.apiKey) env.ANTHROPIC_API_KEY = config.apiKey;
    if (config.model) env.ANTHROPIC_MODEL = config.model;
  }

  if (config.maxTurnTokens) {
    env.CLAUDE_CODE_MAX_TURN_TOKENS = String(config.maxTurnTokens);
  }

  return env;
}

export function resolveConnectionMode(env: Record<string, string | undefined>): ConnectionMode {
  if (env.CLAUDE_CODE_USE_BEDROCK === '1') return 'bedrock';
  if (env.ANTHROPIC_BASE_URL) return 'custom';
  return 'anthropic';
}
