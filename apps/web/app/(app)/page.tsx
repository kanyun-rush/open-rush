'use client';

import {
  ArrowUp,
  ChevronDown,
  Code,
  Database,
  ImageIcon,
  Paperclip,
  Rss,
  Sparkles,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useCallback, useRef, useState } from 'react';

const agents = [
  {
    name: 'Builder',
    letter: 'B',
    color: 'bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400',
  },
  {
    name: 'Coder',
    letter: 'C',
    color: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400',
  },
  {
    name: 'DevOps',
    letter: 'D',
    color: 'bg-orange-50 text-orange-600 dark:bg-orange-950 dark:text-orange-400',
  },
];

const suggestions = [
  {
    icon: ImageIcon,
    title: 'Build a landing page',
    desc: 'Animated hero, glassmorphism cards',
    prompt: 'Build a landing page with animated hero and glassmorphism cards',
  },
  {
    icon: Code,
    title: 'Review a pull request',
    desc: 'Code quality, tests, best practices',
    prompt: 'Review the latest pull request and suggest improvements',
  },
  {
    icon: Database,
    title: 'Write a DB migration',
    desc: 'Schema changes, rollback support',
    prompt: 'Create a database migration to add user preferences table',
  },
  {
    icon: Rss,
    title: 'Set up CI/CD pipeline',
    desc: 'GitHub Actions, tests, deploy',
    prompt: 'Set up GitHub Actions CI/CD pipeline with tests and deploy',
  },
];

export default function HomePage() {
  const router = useRouter();
  const [input, setInput] = useState('');
  const [selectedAgent, setSelectedAgent] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = useCallback(() => {
    const text = input.trim();
    if (!text) return;
    // Navigate to chat with the prompt as a query param
    const params = new URLSearchParams({ prompt: text, agent: agents[selectedAgent].name });
    router.push(`/chat/new?${params.toString()}`);
  }, [input, selectedAgent, router]);

  const handleSuggestion = useCallback(
    (prompt: string) => {
      const params = new URLSearchParams({ prompt, agent: agents[selectedAgent].name });
      router.push(`/chat/new?${params.toString()}`);
    },
    [selectedAgent, router]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSubmit();
      }
    },
    [handleSubmit]
  );

  const handleInput = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    const el = e.target;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 200)}px`;
  }, []);

  const agent = agents[selectedAgent];

  return (
    <div className="flex-1 flex flex-col">
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto px-6 pt-[12vh] pb-10">
          {/* Welcome */}
          <div className="text-center mb-8">
            <div className="size-12 rounded-2xl bg-gradient-to-br from-blue-50 to-violet-50 dark:from-blue-950 dark:to-violet-950 border border-blue-100 dark:border-blue-900 flex items-center justify-center mx-auto mb-4">
              <Sparkles className="size-6 text-blue-600 dark:text-blue-400" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight mb-1">What do you want to build?</h1>
            <p className="text-[14px] text-muted-foreground">
              Describe your task. The agent will handle the rest.
            </p>
          </div>

          {/* Input box */}
          <div className="mb-8">
            <div className="flex items-end gap-3 border border-border rounded-2xl p-4 bg-card shadow-sm focus-within:border-ring focus-within:ring-2 focus-within:ring-ring/10 focus-within:shadow-md transition-all">
              <button
                type="button"
                className="size-9 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-accent/50 transition cursor-pointer shrink-0"
              >
                <Paperclip className="size-5" />
              </button>
              <textarea
                ref={textareaRef}
                value={input}
                onChange={handleInput}
                onKeyDown={handleKeyDown}
                placeholder="Build a landing page with dark glassmorphism theme..."
                rows={1}
                className="flex-1 bg-transparent border-none outline-none text-[15px] resize-none min-h-[28px] max-h-[200px] placeholder:text-muted-foreground/50 leading-relaxed"
              />
              <button
                type="button"
                onClick={handleSubmit}
                className="size-9 rounded-lg bg-primary text-primary-foreground flex items-center justify-center hover:bg-primary/90 transition cursor-pointer shrink-0"
              >
                <ArrowUp className="size-5" />
              </button>
            </div>
            <div className="flex items-center justify-between mt-2 px-2">
              <span className="text-[11px] text-muted-foreground">
                <kbd className="font-mono text-[10px] bg-muted border border-border px-1 rounded">
                  Enter
                </kbd>{' '}
                to send
              </span>
              {/* Agent selector inline */}
              <button
                type="button"
                className="flex items-center gap-1.5 px-2 py-1 rounded-lg hover:bg-accent/50 transition cursor-pointer text-[12px] text-muted-foreground"
              >
                <div
                  className={`size-5 rounded flex items-center justify-center text-[9px] font-bold ${agent.color}`}
                >
                  {agent.letter}
                </div>
                {agent.name}
                <ChevronDown className="size-3 text-muted-foreground" />
              </button>
            </div>
          </div>

          {/* Agent pills */}
          <div className="flex items-center justify-center gap-2 mb-8">
            <span className="text-[11px] text-muted-foreground mr-1">Agents:</span>
            {agents.map((a, i) => (
              <button
                key={a.name}
                type="button"
                onClick={() => setSelectedAgent(i)}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-medium cursor-pointer transition',
                  i === selectedAgent
                    ? 'border-2 border-primary bg-primary/5 text-foreground'
                    : 'border border-border text-muted-foreground hover:border-foreground/20 hover:text-foreground'
                )}
              >
                <div
                  className={`size-4 rounded flex items-center justify-center text-[8px] font-bold ${a.color}`}
                >
                  {a.letter}
                </div>
                {a.name}
              </button>
            ))}
          </div>

          {/* Suggestion cards */}
          <div className="grid grid-cols-2 gap-2.5">
            {suggestions.map((s) => (
              <button
                key={s.title}
                type="button"
                onClick={() => handleSuggestion(s.prompt)}
                className="flex items-start gap-2.5 p-3.5 rounded-xl border border-border text-left hover:bg-accent/30 hover:border-border transition cursor-pointer group"
              >
                <s.icon className="size-4 text-muted-foreground mt-0.5 shrink-0 group-hover:text-primary transition" />
                <div>
                  <div className="text-[12px] font-medium text-foreground">{s.title}</div>
                  <div className="text-[11px] text-muted-foreground mt-0.5">{s.desc}</div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(' ');
}
