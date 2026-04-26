import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { type ArchiveCandidate, archiveAgentDefinition } from '../archive-agent';

type FetchMock = ReturnType<typeof vi.fn>;

function makeResponse(body: unknown, init: { ok?: boolean; status?: number } = {}): Response {
  const ok = init.ok ?? true;
  const status = init.status ?? (ok ? 200 : 500);
  return {
    ok,
    status,
    json: () => Promise.resolve(body),
  } as unknown as Response;
}

describe('archiveAgentDefinition', () => {
  let fetchMock: FetchMock;

  beforeEach(() => {
    fetchMock = vi.fn();
    globalThis.fetch = fetchMock as unknown as typeof fetch;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('archives and rebinds to next active agent when archived was current', async () => {
    const PROJECT = 'p1';
    const ARCHIVED = 'a1';
    const NEXT = 'a2';

    const candidates: ArchiveCandidate[] = [
      { id: ARCHIVED, archivedAt: null, status: 'active' },
      { id: NEXT, archivedAt: null, status: 'active' },
      { id: 'a3', archivedAt: new Date().toISOString(), status: 'active' },
    ];

    // 1. GET current agent → returns a1 (== archived)
    fetchMock.mockResolvedValueOnce(makeResponse({ data: { binding: { agentId: ARCHIVED } } }));
    // 2. POST archive
    fetchMock.mockResolvedValueOnce(
      makeResponse({ data: { id: ARCHIVED, archivedAt: '2026-01-01T00:00:00Z' } })
    );
    // 3. PUT rebind
    fetchMock.mockResolvedValueOnce(makeResponse({ data: {} }));

    const result = await archiveAgentDefinition({
      projectId: PROJECT,
      agentId: ARCHIVED,
      candidates,
    });

    expect(result.archived.id).toBe(ARCHIVED);
    expect(result.rebound).toEqual({ nextAgentId: NEXT });
    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(fetchMock.mock.calls[0][0]).toBe(`/api/projects/${PROJECT}/agent`);
    expect(fetchMock.mock.calls[1][0]).toContain('/api/v1/agent-definitions/');
    expect(fetchMock.mock.calls[1][0]).toContain('/archive');
    expect(fetchMock.mock.calls[2][0]).toBe(`/api/projects/${PROJECT}/agent`);
    expect(fetchMock.mock.calls[2][1]).toMatchObject({ method: 'PUT' });
  });

  it('does not rebind when archived agent was NOT current', async () => {
    const PROJECT = 'p1';
    const ARCHIVED = 'a1';
    const CURRENT = 'a2';

    fetchMock.mockResolvedValueOnce(makeResponse({ data: { binding: { agentId: CURRENT } } }));
    fetchMock.mockResolvedValueOnce(
      makeResponse({ data: { id: ARCHIVED, archivedAt: '2026-01-01T00:00:00Z' } })
    );

    const result = await archiveAgentDefinition({
      projectId: PROJECT,
      agentId: ARCHIVED,
      candidates: [
        { id: ARCHIVED, archivedAt: null, status: 'active' },
        { id: CURRENT, archivedAt: null, status: 'active' },
      ],
    });

    expect(result.archived.id).toBe(ARCHIVED);
    expect(result.rebound).toBeNull();
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('does not rebind when no replacement candidate exists', async () => {
    const PROJECT = 'p1';
    const ARCHIVED = 'a1';

    fetchMock.mockResolvedValueOnce(makeResponse({ data: { binding: { agentId: ARCHIVED } } }));
    fetchMock.mockResolvedValueOnce(
      makeResponse({ data: { id: ARCHIVED, archivedAt: '2026-01-01T00:00:00Z' } })
    );

    const result = await archiveAgentDefinition({
      projectId: PROJECT,
      agentId: ARCHIVED,
      candidates: [
        { id: ARCHIVED, archivedAt: null, status: 'active' },
        { id: 'a3', archivedAt: '2025-12-01T00:00:00Z', status: 'active' },
      ],
    });

    expect(result.rebound).toEqual({ nextAgentId: null });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('throws when archive request fails (no rebind attempted)', async () => {
    const PROJECT = 'p1';
    const ARCHIVED = 'a1';

    fetchMock.mockResolvedValueOnce(makeResponse({ data: { binding: { agentId: ARCHIVED } } }));
    fetchMock.mockResolvedValueOnce(
      makeResponse(
        { error: { code: 'FORBIDDEN', message: 'Missing scope' } },
        { ok: false, status: 403 }
      )
    );

    await expect(
      archiveAgentDefinition({
        projectId: PROJECT,
        agentId: ARCHIVED,
        candidates: [
          { id: ARCHIVED, archivedAt: null, status: 'active' },
          { id: 'a2', archivedAt: null, status: 'active' },
        ],
      })
    ).rejects.toThrow('Missing scope');
    // Only GET current + failed POST archive — no PUT
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('throws when rebind fails (archive already committed)', async () => {
    const PROJECT = 'p1';
    const ARCHIVED = 'a1';
    const NEXT = 'a2';

    fetchMock.mockResolvedValueOnce(makeResponse({ data: { binding: { agentId: ARCHIVED } } }));
    fetchMock.mockResolvedValueOnce(
      makeResponse({ data: { id: ARCHIVED, archivedAt: '2026-01-01T00:00:00Z' } })
    );
    fetchMock.mockResolvedValueOnce(
      makeResponse(
        { error: { code: 'FORBIDDEN', message: 'No permission' } },
        { ok: false, status: 403 }
      )
    );

    await expect(
      archiveAgentDefinition({
        projectId: PROJECT,
        agentId: ARCHIVED,
        candidates: [
          { id: ARCHIVED, archivedAt: null, status: 'active' },
          { id: NEXT, archivedAt: null, status: 'active' },
        ],
      })
    ).rejects.toThrow(/rebind failed/);
  });

  it('falls through gracefully when current-agent GET errors', async () => {
    const PROJECT = 'p1';
    const ARCHIVED = 'a1';

    fetchMock.mockResolvedValueOnce(makeResponse({ error: 'boom' }, { ok: false, status: 500 }));
    fetchMock.mockResolvedValueOnce(
      makeResponse({ data: { id: ARCHIVED, archivedAt: '2026-01-01T00:00:00Z' } })
    );

    const result = await archiveAgentDefinition({
      projectId: PROJECT,
      agentId: ARCHIVED,
      candidates: [
        { id: ARCHIVED, archivedAt: null, status: 'active' },
        { id: 'a2', archivedAt: null, status: 'active' },
      ],
    });

    // No rebind because we couldn't confirm the archived was current.
    expect(result.rebound).toBeNull();
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});
