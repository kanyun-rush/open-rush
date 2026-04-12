import { describe, expect, it } from 'vitest';
import {
  canTransition,
  getValidTransitions,
  isFinalizing,
  isTerminal,
} from '../run/run-state-machine.js';

describe('RunStateMachine', () => {
  describe('canTransition', () => {
    it('allows queued → provisioning', () => {
      expect(canTransition('queued', 'provisioning')).toBe(true);
    });

    it('allows queued → failed', () => {
      expect(canTransition('queued', 'failed')).toBe(true);
    });

    it('allows running → finalizing_prepare', () => {
      expect(canTransition('running', 'finalizing_prepare')).toBe(true);
    });

    it('allows running → worker_unreachable', () => {
      expect(canTransition('running', 'worker_unreachable')).toBe(true);
    });

    it('allows failed → queued (retry)', () => {
      expect(canTransition('failed', 'queued')).toBe(true);
    });

    it('disallows completed → anything', () => {
      expect(canTransition('completed', 'queued')).toBe(false);
      expect(canTransition('completed', 'failed')).toBe(false);
    });

    it('disallows backwards transitions', () => {
      expect(canTransition('running', 'queued')).toBe(false);
      expect(canTransition('provisioning', 'queued')).toBe(false);
    });

    it('allows finalization chain', () => {
      expect(canTransition('finalizing_prepare', 'finalizing_uploading')).toBe(true);
      expect(canTransition('finalizing_uploading', 'finalizing_verifying')).toBe(true);
      expect(canTransition('finalizing_verifying', 'finalizing_metadata_commit')).toBe(true);
      expect(canTransition('finalizing_metadata_commit', 'finalized')).toBe(true);
      expect(canTransition('finalized', 'completed')).toBe(true);
    });

    it('allows finalization retry path', () => {
      expect(canTransition('finalizing_uploading', 'finalizing_retryable_failed')).toBe(true);
      expect(canTransition('finalizing_retryable_failed', 'finalizing_uploading')).toBe(true);
      expect(canTransition('finalizing_retryable_failed', 'finalizing_timeout')).toBe(true);
      expect(canTransition('finalizing_timeout', 'finalizing_manual_intervention')).toBe(true);
    });
  });

  describe('getValidTransitions', () => {
    it('returns valid targets from queued', () => {
      expect(getValidTransitions('queued')).toEqual(['provisioning', 'failed']);
    });

    it('returns empty for completed', () => {
      expect(getValidTransitions('completed')).toEqual([]);
    });
  });

  describe('isTerminal', () => {
    it('completed is terminal', () => expect(isTerminal('completed')).toBe(true));
    it('failed is terminal', () => expect(isTerminal('failed')).toBe(true));
    it('running is not terminal', () => expect(isTerminal('running')).toBe(false));
  });

  describe('isFinalizing', () => {
    it('finalizing_prepare is finalizing', () =>
      expect(isFinalizing('finalizing_prepare')).toBe(true));
    it('finalized is finalizing', () => expect(isFinalizing('finalized')).toBe(true));
    it('running is not finalizing', () => expect(isFinalizing('running')).toBe(false));
  });
});
