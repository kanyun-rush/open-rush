'use client';

import { useChat } from '@ai-sdk/react';
import { TextStreamChatTransport } from 'ai';
import { useCallback, useMemo, useState } from 'react';
import { MessageList } from './message-list';
import { PromptInput } from './prompt-input';

export function ChatView() {
  const transport = useMemo(() => new TextStreamChatTransport({ api: '/api/chat' }), []);

  const { messages, sendMessage, status, stop, error } = useChat({
    transport,
  });

  const [input, setInput] = useState('');

  const isLoading = status === 'submitted' || status === 'streaming';

  const handleSubmit = useCallback(() => {
    const text = input.trim();
    if (!text || isLoading) return;
    setInput('');
    sendMessage({ text });
  }, [input, isLoading, sendMessage]);

  return (
    <div className="flex flex-col h-full">
      {error && (
        <div className="mx-4 mt-2 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
          {error.message || 'An error occurred. Please try again.'}
        </div>
      )}
      <MessageList messages={messages} isLoading={isLoading} />
      <PromptInput
        input={input}
        isLoading={isLoading}
        onInputChange={setInput}
        onSubmit={handleSubmit}
        onStop={stop}
      />
    </div>
  );
}
