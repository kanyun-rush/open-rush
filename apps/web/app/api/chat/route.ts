import { streamText } from 'ai';
import { claudeCode } from 'ai-sdk-provider-claude-code';
import { requireAuth } from '@/lib/api-utils';

// Allow streaming responses up to 300 seconds
export const maxDuration = 300;

export async function POST(req: Request) {
  try {
    await requireAuth();
  } catch (res) {
    return res as Response;
  }

  const { messages } = await req.json();

  const modelId = process.env.CLAUDE_MODEL || 'sonnet';

  // Build env overrides for the Claude Agent SDK.
  // When ANTHROPIC_BASE_URL is set (e.g. GLM compatible endpoint),
  // it is forwarded to the underlying SDK so requests go to that endpoint.
  const env: Record<string, string> = {};
  if (process.env.ANTHROPIC_BASE_URL) {
    env.ANTHROPIC_BASE_URL = process.env.ANTHROPIC_BASE_URL;
  }
  if (process.env.ANTHROPIC_API_KEY) {
    env.ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
  }

  const result = streamText({
    model: claudeCode(modelId, {
      permissionMode: 'bypassPermissions',
      maxTurns: 10,
      ...(Object.keys(env).length > 0 ? { env } : {}),
    }),
    messages,
  });

  return result.toTextStreamResponse();
}
