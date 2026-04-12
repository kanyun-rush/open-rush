'use client';

import { Check, Copy } from 'lucide-react';
import { useCallback, useState } from 'react';
import { cn } from '@/lib/utils';

interface CodeBlockProps {
  code: string;
  language?: string;
}

export function CodeBlock({ code, language }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [code]);

  return (
    <div className="relative group my-2 rounded-md bg-secondary/50 overflow-hidden">
      {language && (
        <div className="flex items-center justify-between px-3 py-1.5 border-b border-border text-xs text-muted-foreground">
          <span>{language}</span>
        </div>
      )}
      <button
        type="button"
        onClick={handleCopy}
        className={cn(
          'absolute top-2 right-2 p-1.5 rounded-md',
          'bg-background/80 border border-border',
          'opacity-0 group-hover:opacity-100 transition-opacity',
          'hover:bg-accent cursor-pointer'
        )}
        aria-label="Copy code"
      >
        {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
      </button>
      <pre className="p-3 overflow-x-auto">
        <code className="font-mono text-xs">{code}</code>
      </pre>
    </div>
  );
}
