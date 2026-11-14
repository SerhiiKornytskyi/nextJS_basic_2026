'use client';

import { lusitana } from '@/app/ui/fonts';
import { useState, useTransition } from 'react';
import { askChatbot } from '@/app/lib/chatbot';
import { askWeather, askWeatherZod } from '@/app/lib/toolUsageExample'; // FIX: runTool is no longer exported; askWeather is the Server Action

export default function Page() {
  const [query, setQuery] = useState('');
  const [answer, setAnswer] = useState('');
  const [isPending, startTransition] = useTransition();

  const handleChatbotQuery = () => {
    startTransition(async () => {
      setAnswer(await askChatbot(query));
    });
  };

  // FIX: the tool call used to run directly in the component body, so it fired on EVERY render.
  // Now it only runs when the button is clicked.
  const handleWeatherQuery = () => {
    startTransition(async () => {
      setAnswer(
        await askWeather(
          "What's the weather in Krakow for 4 days ? and which tool is used ?"
        )
      );
    });
  };

  // usind ZOD
   const handleWeatherQueryZod = () => {
    startTransition(async () => {
      const message = {
        role: 'user',
        content: "What's the weather in Krakow for 4 days ? and which tool is used ?",
      } as Parameters<typeof askWeatherZod>[0];
      
      const response = await askWeatherZod(message);
      setAnswer(typeof response === 'string' ? response : JSON.stringify(response.content, null, 2));
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
        <button className="bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2" onClick={handleWeatherQuery} disabled={isPending}>
          Ask weather (tools, hardcoded tool select)
        </button>
        <button className="bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2" onClick={handleWeatherQueryZod} disabled={isPending}>
          Ask weather (ZOD)
        </button>
      </div>
      {answer && <p className="mt-4 whitespace-pre-wrap">{answer}</p>}
    </div>
  );
}
