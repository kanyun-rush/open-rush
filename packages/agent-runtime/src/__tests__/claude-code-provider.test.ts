import { describe, expect, it } from 'vitest';
import { buildEnvVars, resolveConnectionMode } from '../claude-code-provider.js';

describe('buildEnvVars', () => {
  it('builds Bedrock env vars', () => {
    const env = buildEnvVars({
      connectionMode: 'bedrock',
      awsRegion: 'us-west-2',
      awsAccessKeyId: 'AKIA...',
      awsSecretAccessKey: 'secret',
      model: 'arn:aws:bedrock:...',
    });
    expect(env.CLAUDE_CODE_USE_BEDROCK).toBe('1');
    expect(env.AWS_REGION).toBe('us-west-2');
    expect(env.ANTHROPIC_MODEL).toBe('arn:aws:bedrock:...');
  });

  it('builds Anthropic API env vars', () => {
    const env = buildEnvVars({
      connectionMode: 'anthropic',
      apiKey: 'sk-ant-test',
      model: 'claude-sonnet-4-6',
    });
    expect(env.ANTHROPIC_API_KEY).toBe('sk-ant-test');
    expect(env.ANTHROPIC_MODEL).toBe('claude-sonnet-4-6');
    expect(env.CLAUDE_CODE_USE_BEDROCK).toBeUndefined();
  });

  it('builds custom endpoint env vars', () => {
    const env = buildEnvVars({
      connectionMode: 'custom',
      customEndpoint: 'https://my-proxy.example.com',
      apiKey: 'custom-key',
    });
    expect(env.ANTHROPIC_BASE_URL).toBe('https://my-proxy.example.com');
    expect(env.ANTHROPIC_API_KEY).toBe('custom-key');
  });

  it('includes maxTurnTokens', () => {
    const env = buildEnvVars({
      connectionMode: 'anthropic',
      maxTurnTokens: 100000,
    });
    expect(env.CLAUDE_CODE_MAX_TURN_TOKENS).toBe('100000');
  });
});

describe('resolveConnectionMode', () => {
  it('detects bedrock', () => {
    expect(resolveConnectionMode({ CLAUDE_CODE_USE_BEDROCK: '1' })).toBe('bedrock');
  });

  it('detects custom endpoint', () => {
    expect(resolveConnectionMode({ ANTHROPIC_BASE_URL: 'https://proxy.com' })).toBe('custom');
  });

  it('defaults to anthropic', () => {
    expect(resolveConnectionMode({})).toBe('anthropic');
  });

  it('bedrock takes priority over custom', () => {
    expect(
      resolveConnectionMode({
        CLAUDE_CODE_USE_BEDROCK: '1',
        ANTHROPIC_BASE_URL: 'https://proxy.com',
      })
    ).toBe('bedrock');
  });
});
