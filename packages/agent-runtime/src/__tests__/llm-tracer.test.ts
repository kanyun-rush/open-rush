import { randomUUID } from 'node:crypto';
import { beforeEach, describe, expect, it } from 'vitest';
import { LlmTracer } from '../llm-tracer.js';

describe('LlmTracer', () => {
  let tracer: LlmTracer;
  const runId = randomUUID();

  beforeEach(() => {
    tracer = new LlmTracer();
  });

  it('records and retrieves entries by run', () => {
    tracer.record({
      id: randomUUID(),
      runId,
      attributes: {
        model: 'claude-sonnet-4-6',
        provider: 'anthropic',
        inputTokens: 100,
        outputTokens: 50,
        totalTokens: 150,
        costCents: 5,
        latencyMs: 1200,
      },
      startedAt: new Date(),
      completedAt: new Date(),
    });

    const entries = tracer.getByRun(runId);
    expect(entries).toHaveLength(1);
    expect(entries[0].attributes.model).toBe('claude-sonnet-4-6');
  });

  it('computes usage summary', () => {
    tracer.record({
      id: randomUUID(),
      runId,
      attributes: {
        model: 'claude-sonnet-4-6',
        provider: 'anthropic',
        inputTokens: 100,
        outputTokens: 50,
        totalTokens: 150,
        costCents: 5,
        latencyMs: 1000,
      },
      startedAt: new Date(),
      completedAt: new Date(),
    });
    tracer.record({
      id: randomUUID(),
      runId,
      attributes: {
        model: 'claude-sonnet-4-6',
        provider: 'anthropic',
        inputTokens: 200,
        outputTokens: 100,
        totalTokens: 300,
        costCents: 10,
        latencyMs: 2000,
      },
      startedAt: new Date(),
      completedAt: new Date(),
    });

    const summary = tracer.getUsageSummary(runId);
    expect(summary.totalCalls).toBe(2);
    expect(summary.totalInputTokens).toBe(300);
    expect(summary.totalOutputTokens).toBe(150);
    expect(summary.totalTokens).toBe(450);
    expect(summary.totalCostCents).toBe(15);
    expect(summary.avgLatencyMs).toBe(1500);
  });

  it('returns zero summary for unknown run', () => {
    const summary = tracer.getUsageSummary(randomUUID());
    expect(summary.totalCalls).toBe(0);
    expect(summary.totalTokens).toBe(0);
  });

  it('isolates by run', () => {
    const run1 = randomUUID();
    const run2 = randomUUID();
    tracer.record({
      id: randomUUID(),
      runId: run1,
      attributes: { model: 'm1', provider: 'p1' },
      startedAt: new Date(),
      completedAt: new Date(),
    });
    tracer.record({
      id: randomUUID(),
      runId: run2,
      attributes: { model: 'm2', provider: 'p2' },
      startedAt: new Date(),
      completedAt: new Date(),
    });

    expect(tracer.getByRun(run1)).toHaveLength(1);
    expect(tracer.getByRun(run2)).toHaveLength(1);
  });

  it('clears all entries', () => {
    tracer.record({
      id: randomUUID(),
      runId,
      attributes: { model: 'm', provider: 'p' },
      startedAt: new Date(),
      completedAt: new Date(),
    });
    tracer.clear();
    expect(tracer.getByRun(runId)).toHaveLength(0);
  });
});
