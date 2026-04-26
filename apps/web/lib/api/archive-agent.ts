/**
 * archiveAgentDefinition — archive an AgentDefinition via v1, then (if needed)
 * rebind the project's current agent to another active definition.
 *
 * Background: legacy `DELETE /api/agents/:id` used to archive the definition AND
 * rebind `projects.currentAgentId` to another active agent when the removed one
 * was current. v1 `POST /api/v1/agent-definitions/:id/archive` only sets
 * `archivedAt` — the project binding is intentionally out of its scope.
 *
 * This helper restores the UX: it calls v1 archive, checks whether the removed
 * definition was the project's current binding, and if so picks a replacement
 * (first non-archived definition other than the removed one) and PUTs it to
 * `/api/projects/:projectId/agent`. If no replacement exists the binding is
 * left untouched (matches legacy behavior).
 */

export interface ArchiveCandidate {
  id: string;
  archivedAt?: string | Date | null;
  status?: string;
}

export interface ArchiveAgentOptions {
  projectId: string;
  agentId: string;
  /**
   * Snapshot of the project's definitions *before* archive. Used to pick a
   * replacement. Should include the agent being archived (it'll be filtered).
   */
  candidates: ArchiveCandidate[];
}

export interface ArchiveAgentResult {
  archived: { id: string; archivedAt: string };
  rebound: { nextAgentId: string | null } | null;
}

function pickReplacement(candidates: ArchiveCandidate[], archivedId: string): string | null {
  for (const c of candidates) {
    if (c.id === archivedId) continue;
    if (c.archivedAt) continue;
    if (c.status && c.status !== 'active') continue;
    return c.id;
  }
  return null;
}

async function fetchCurrentAgentId(projectId: string): Promise<string | null> {
  const res = await fetch(`/api/projects/${projectId}/agent`);
  if (!res.ok) return null;
  const json = (await res.json().catch(() => null)) as {
    data?: {
      currentAgent?: { id?: string } | null;
      binding?: { agentId?: string } | null;
    };
  } | null;
  return json?.data?.binding?.agentId ?? json?.data?.currentAgent?.id ?? null;
}

export async function archiveAgentDefinition(
  options: ArchiveAgentOptions
): Promise<ArchiveAgentResult> {
  const { projectId, agentId, candidates } = options;

  // 1. Check whether the definition was the project's current binding. Do this
  //    BEFORE archive — after archive the binding will still point to the same
  //    row (archive doesn't touch project_agents) but reading it first avoids
  //    an unnecessary PUT when the agent wasn't current to begin with.
  const currentBefore = await fetchCurrentAgentId(projectId).catch(() => null);

  // 2. Archive via v1
  const archiveRes = await fetch(
    `/api/v1/agent-definitions/${encodeURIComponent(agentId)}/archive`,
    { method: 'POST' }
  );
  const archiveJson = (await archiveRes.json().catch(() => null)) as {
    data?: { id: string; archivedAt: string };
    error?: { message?: string };
  } | null;
  if (!archiveRes.ok || !archiveJson?.data) {
    const msg = archiveJson?.error?.message ?? `HTTP ${archiveRes.status}`;
    throw new Error(msg);
  }

  // 3. If the archived definition was the current binding, pick a replacement
  //    and rebind. No replacement → leave binding as-is (legacy behavior).
  if (currentBefore && currentBefore === agentId) {
    const nextAgentId = pickReplacement(candidates, agentId);
    if (nextAgentId) {
      const rebindRes = await fetch(`/api/projects/${projectId}/agent`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agentId: nextAgentId }),
      });
      if (!rebindRes.ok) {
        const rebindJson = (await rebindRes.json().catch(() => null)) as {
          error?: { message?: string };
        } | null;
        const msg = rebindJson?.error?.message ?? `HTTP ${rebindRes.status}`;
        throw new Error(`Archive succeeded but rebind failed: ${msg}`);
      }
    }
    return {
      archived: archiveJson.data,
      rebound: { nextAgentId },
    };
  }

  return {
    archived: archiveJson.data,
    rebound: null,
  };
}
