export type RunStatus =
  | 'queued'
  | 'provisioning'
  | 'preparing'
  | 'running'
  | 'finalizing_prepare'
  | 'finalizing_uploading'
  | 'finalizing_verifying'
  | 'finalizing_metadata_commit'
  | 'finalized'
  | 'completed'
  | 'failed'
  | 'worker_unreachable'
  | 'finalizing_retryable_failed'
  | 'finalizing_timeout'
  | 'finalizing_manual_intervention';

const TRANSITIONS: Record<string, RunStatus[]> = {
  queued: ['provisioning', 'failed'],
  provisioning: ['preparing', 'failed'],
  preparing: ['running', 'failed'],
  running: ['finalizing_prepare', 'failed', 'worker_unreachable'],
  worker_unreachable: ['running', 'failed'],
  finalizing_prepare: ['finalizing_uploading', 'failed'],
  finalizing_uploading: ['finalizing_verifying', 'finalizing_retryable_failed', 'failed'],
  finalizing_verifying: ['finalizing_metadata_commit', 'finalizing_retryable_failed', 'failed'],
  finalizing_metadata_commit: ['finalized', 'failed'],
  finalized: ['completed'],
  finalizing_retryable_failed: ['finalizing_uploading', 'finalizing_timeout'],
  finalizing_timeout: ['finalizing_manual_intervention', 'failed'],
  finalizing_manual_intervention: ['failed'],
  completed: [],
  failed: ['queued'],
};

export function canTransition(from: RunStatus, to: RunStatus): boolean {
  return TRANSITIONS[from]?.includes(to) ?? false;
}

export function getValidTransitions(from: RunStatus): RunStatus[] {
  return TRANSITIONS[from] ?? [];
}

export function isTerminal(status: RunStatus): boolean {
  return status === 'completed' || status === 'failed';
}

export function isFinalizing(status: RunStatus): boolean {
  return status.startsWith('finalizing_') || status === 'finalized';
}
