'use client';

import { lusitana } from '@/app/ui/fonts';
import { useState, useTransition } from 'react';
import { askChatbot } from '@/app/lib/chatbot';

export default function Page() {
  const [query, setQuery] = useState('');
  const [answer, setAnswer] = useState('');
  const [isPending, startTransition] = useTransition();

  const handleChatbotQuery = () => {
    startTransition(async () => {
      setAnswer(await askChatbot(query));
    });
  };

  return (
    <div className="w-full">
      <div className="flex w-full items-center justify-between">
        <h1 className={`${lusitana.className} text-2xl`}>Ask chatbot</h1>
      </div>
      <div className="mt-4 flex items-center gap-2 md:mt-8">
        <input
          value={query}
          type="text"
          placeholder="Ask something..."
          onChange={(e) => setQuery(e.target.value)}
        />
        <button className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2" onClick={handleChatbotQuery} disabled={isPending}>
          {isPending ? 'Thinking...' : 'Ask about'}
        </button>
      </div>
      {answer && <p className="mt-4 whitespace-pre-wrap">{answer}</p>}
    </div>
  );
}
