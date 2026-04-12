export interface AppConfig {
  nodeEnv: string;
  logLevel: string;

  databaseUrl: string;
  redisUrl: string;

  s3Endpoint: string;
  s3Bucket: string;
  s3AccessKeyId: string;
  s3SecretAccessKey: string;
  s3Region: string;

  vaultMasterKey: string;

  anthropicApiKey?: string;
  anthropicModel?: string;
  awsRegion?: string;
  awsAccessKeyId?: string;
  awsSecretAccessKey?: string;
  claudeCodeUseBedrock?: boolean;

  otelEnabled: boolean;
  otelTraceUrl?: string;
  otelMetricUrl?: string;

  nextauthUrl?: string;
  nextauthSecret?: string;
  githubClientId?: string;
  githubClientSecret?: string;

  port: number;
}

export function loadConfig(env: Record<string, string | undefined> = process.env): AppConfig {
  return {
    nodeEnv: env.NODE_ENV ?? 'development',
    logLevel: env.LOG_LEVEL ?? 'info',

    databaseUrl: env.DATABASE_URL ?? 'postgresql://rush:rush@localhost:5432/rush',
    redisUrl: env.REDIS_URL ?? 'redis://localhost:6379',

    s3Endpoint: env.S3_ENDPOINT ?? 'http://localhost:9000',
    s3Bucket: env.S3_BUCKET ?? 'rush',
    s3AccessKeyId: env.S3_ACCESS_KEY_ID ?? 'minioadmin',
    s3SecretAccessKey: env.S3_SECRET_ACCESS_KEY ?? 'minioadmin',
    s3Region: env.S3_REGION ?? 'us-east-1',

    vaultMasterKey: env.VAULT_MASTER_KEY ?? '',

    anthropicApiKey: env.ANTHROPIC_API_KEY,
    anthropicModel: env.ANTHROPIC_MODEL,
    awsRegion: env.AWS_REGION,
    awsAccessKeyId: env.AWS_ACCESS_KEY_ID,
    awsSecretAccessKey: env.AWS_SECRET_ACCESS_KEY,
    claudeCodeUseBedrock: env.CLAUDE_CODE_USE_BEDROCK === '1',

    otelEnabled: env.OTEL_ENABLED === '1' || env.OTEL_ENABLED === 'true',
    otelTraceUrl: env.OTEL_TRACE_URL,
    otelMetricUrl: env.OTEL_METRIC_URL,

    nextauthUrl: env.NEXTAUTH_URL,
    nextauthSecret: env.NEXTAUTH_SECRET,
    githubClientId: env.GITHUB_CLIENT_ID,
    githubClientSecret: env.GITHUB_CLIENT_SECRET,

    port: Number.parseInt(env.PORT ?? '3000', 10),
  };
}
