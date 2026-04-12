'use client';

import { CheckCircle2, ChevronDown, Loader2, XCircle } from 'lucide-react';
import { useCallback, useState } from 'react';
import { cn } from '@/lib/utils';

interface ToolCardProps {
  toolName: string;
  state: 'partial-call' | 'call' | 'result' | 'error';
  args?: Record<string, unknown>;
  result?: unknown;
}

export function ToolCard({ toolName, state, args, result }: ToolCardProps) {
  const [expanded, setExpanded] = useState(false);

  const toggle = useCallback(() => setExpanded((v) => !v), []);

  const isRunning = state === 'partial-call' || state === 'call';
  const isError = state === 'error';

  return (
    <div className="my-2 border border-border rounded-lg overflow-hidden">
      <button
        type="button"
        onClick={toggle}
        className="w-full px-3 py-2 flex items-center gap-2 bg-secondary/50 hover:bg-secondary/70 transition-colors cursor-pointer"
      >
        <span className="text-sm font-medium">{toolName}</span>
        <span className="ml-auto flex items-center gap-1.5">
          {isRunning && (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Running</span>
            </>
          )}
          {state === 'result' && (
            <>
              <CheckCircle2 className="h-3.5 w-3.5 text-foreground" />
              <span className="text-xs text-muted-foreground">Done</span>
            </>
          )}
          {isError && (
            <>
              <XCircle className="h-3.5 w-3.5 text-destructive" />
              <span className="text-xs text-destructive">Error</span>
            </>
          )}
        </span>
        <ChevronDown
          className={cn(
            'h-4 w-4 text-muted-foreground transition-transform',
            expanded && 'rotate-180'
          )}
        />
      </button>
      {expanded && (
        <div className="px-3 py-2 font-mono text-xs space-y-2">
          {args && (
            <div>
              <p className="text-muted-foreground mb-1">Input:</p>
              <pre className="whitespace-pre-wrap break-all">{JSON.stringify(args, null, 2)}</pre>
            </div>
          )}
          {result !== undefined && (
            <div>
              <p className="text-muted-foreground mb-1">Output:</p>
              <pre className={cn('whitespace-pre-wrap break-all', isError && 'text-destructive')}>
                {typeof result === 'string' ? result : JSON.stringify(result, null, 2)}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
