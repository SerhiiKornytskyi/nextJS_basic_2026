'use server';

// ZOD as tool runner
import { betaZodTool } from "@anthropic-ai/sdk/helpers/beta/zod";
// betaZodTool expects schemas from the installed Zod API.
import { z } from "zod/v4";

import Anthropic from '@anthropic-ai/sdk';
import { BetaMessage } from "@anthropic-ai/sdk/resources/beta.mjs";

// == TOOL USAGE EXAMPLE ==

const client = new Anthropic();

// FIX: not exported. A 'use server' file may only export async functions
// (each export becomes a Server Action). Exporting this array caused the rendering error.
const tools: Anthropic.Tool[] = [
  {
    name: "get_weather",
    description: "Get today's current weather for a city.",
    input_schema: {
      type: "object",
      properties: {
        city: { type: "string", description: "The city to check" }
      },
      required: ["city"]
    }
  },
  {
    name: "get_forecast",
    description: "Get the weather forecast for the next few days for a city.",
    input_schema: {
      type: "object",
      properties: {
        city: { type: "string", description: "The city to check" }
      },
      required: ["city"]
    }
  }
];

// Two hardcoded lookups. In a real app, these would call a weather service.
const getWeather = (city: string) => `${city} today: 34F, snow flurries`;
const getForecast = (city: string) => `${city}, next three days: 38F, 45F, and 52F, sunny`;

// FIX: runTool is now a private, synchronous helper that only executes ONE tool.
// The agent loop used to live below its switch, where it was unreachable and would have
// recursed into runTool. Not exported, so it's no longer exposed as a Server Action.
function runTool(name: string, input: unknown): string {
   console.log(`runTool called with name: ${name}, input: ${JSON.stringify(input)}`);
  if (
    typeof input !== 'object' ||
    input === null ||
    !('city' in input) ||
    typeof input.city !== 'string'
  ) {
    return 'Invalid tool input: expected a city.';
  }

  switch (name) {
    case 'get_weather':
      console.log(`Running get_weather tool with input: ${JSON.stringify(input)}`);
      return getWeather(input.city);
    case 'get_forecast':
      console.log(`Running get_forecast tool with input: ${JSON.stringify(input)}`);
      return getForecast(input.city);
    default:
      // FIX: restored the default case so an unknown tool name still returns a string to Claude
      return `Unknown tool: ${name}`;
  }
}

// FIX: the agent loop now lives in its own exported async function. This is the Server Action
// the page calls, and it returns the final answer instead of only logging it.
export async function askWeather(question: string): Promise<string> {
  // FIX: `messages` is created per call. At module level it was shared by every request
  // on the server, so conversations piled up on top of each other.
  const messages: Anthropic.MessageParam[] = [{ role: 'user', content: question }];

  while (true) {
    const response = await client.messages.create({
      model: 'claude-sonnet-5',
      max_tokens: 10000, // FIX: was 1024, which can cut answers off mid-sentence
      messages,
      tools,
    });

    if (response.stop_reason !== 'tool_use') {
      // Claude is done. This is the final answer.
      // FIX: return the text. The old console.log(`${block}`) printed "[object Object]".
      const finalAnswer = response.content
        .filter((block): block is Anthropic.TextBlock => block.type === 'text')
        .map((block) => block.text)
        .join('\n');
      console.log('Final answer:', finalAnswer);
      return finalAnswer;
    }

    messages.push({ role: 'assistant', content: response.content });

    // All tool results go back together in a single user message.
    const toolResults: Anthropic.ToolResultBlockParam[] = response.content
      .filter((block): block is Anthropic.ToolUseBlock => block.type === 'tool_use')
      .map((block) => ({
        type: 'tool_result',
        tool_use_id: block.id,
        content: runTool(block.name, block.input), // FIX: no recursion. runTool only runs the tool.
      }));

    messages.push({ role: 'user', content: toolResults });
  }
}

// using ZOD

const forecastTool = betaZodTool({
  name: "get_forecast",
  description: "Get the weather forecast for the next few days for a city.",
  inputSchema: z.object({
    city: z.string().describe("The city to check"),
  }),
  run: async ({ city }) => getForecast(city),
});

const weatherTool = betaZodTool({
  name: "get_weather",
  description: "Get today's current weather for a city.",
  inputSchema: z.object({
    city: z.string().describe("The city to check"),
  }),
  run: async ({ city }) => getWeather(city),
});

export async function askWeatherZod(question: BetaMessage): Promise<BetaMessage> {
  const runner = client.beta.messages.toolRunner({
    model: "claude-sonnet-5",
    thinking: {"type": "adaptive", "display": "summarized"},  // summarized = return the reasoning text
    max_tokens: 1024,
    messages: [
      {
        role: "user",
        content:
          "I'm packing for a three-day trip to Denver. What's the weather today and over the next few days?",
      },
    ],
    tools: [weatherTool, forecastTool],
  });

  const finalMessage = await runner;
  return finalMessage;
}