export interface LlmSpanAttributes {
  model: string;
  provider: string;
  inputTokens?: number;
  outputTokens?: number;
  totalTokens?: number;
  costCents?: number;
  latencyMs?: number;
  temperature?: number;
  maxTokens?: number;
  finishReason?: string;
}

export interface LlmTraceEntry {
  id: string;
  runId: string;
  attributes: LlmSpanAttributes;
  startedAt: Date;
  completedAt: Date;
  error?: string;
}

export interface LlmTraceStore {
  record(entry: LlmTraceEntry): Promise<void>;
  getByRun(runId: string): Promise<LlmTraceEntry[]>;
  getUsageSummary(runId: string): Promise<LlmUsageSummary>;
}

export interface LlmUsageSummary {
  totalCalls: number;
  totalInputTokens: number;
  totalOutputTokens: number;
  totalTokens: number;
  totalCostCents: number;
  avgLatencyMs: number;
}

export class LlmTracer {
  private entries: LlmTraceEntry[] = [];

  record(entry: LlmTraceEntry): void {
    this.entries.push(entry);
  }

  getByRun(runId: string): LlmTraceEntry[] {
    return this.entries.filter((e) => e.runId === runId);
  }

  getUsageSummary(runId: string): LlmUsageSummary {
    const runEntries = this.getByRun(runId);
    if (runEntries.length === 0) {
      return {
        totalCalls: 0,
        totalInputTokens: 0,
        totalOutputTokens: 0,
        totalTokens: 0,
        totalCostCents: 0,
        avgLatencyMs: 0,
      };
    }

    let totalInputTokens = 0;
    let totalOutputTokens = 0;
    let totalTokens = 0;
    let totalCostCents = 0;
    let totalLatency = 0;

    for (const entry of runEntries) {
      totalInputTokens += entry.attributes.inputTokens ?? 0;
      totalOutputTokens += entry.attributes.outputTokens ?? 0;
      totalTokens += entry.attributes.totalTokens ?? 0;
      totalCostCents += entry.attributes.costCents ?? 0;
      totalLatency += entry.attributes.latencyMs ?? 0;
    }

    return {
      totalCalls: runEntries.length,
      totalInputTokens,
      totalOutputTokens,
      totalTokens,
      totalCostCents,
      avgLatencyMs: Math.round(totalLatency / runEntries.length),
    };
  }

  clear(): void {
    this.entries = [];
  }
}
