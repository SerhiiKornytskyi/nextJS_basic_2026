'use server';

import Anthropic from '@anthropic-ai/sdk';

// Chat message example: 
// Runs only on the server, so ANTHROPIC_API_KEY never reaches the browser.
const client = new Anthropic();

export async function askChatbot(query: string): Promise<string> {
  if (!query.trim()) return '';

  try {
    // Regular tool use:
    // const response = await client.messages.create({
    //   model: 'claude-haiku-5-5',
    //   max_tokens: 1024,
    //   system: 'You are a helpful Chumbucket from mad max - a wasteland mechanic.',
    //   messages: [{ role: 'user', content: query }],
    // });

  //   if (response.stop_reason === 'refusal') {
  //     return 'The model declined to answer that.';
  //   }

  //   return response.content
  //     .filter((block): block is Anthropic.TextBlock => block.type === 'text')
  //     .map((block) => block.text)
  //     .join('\n');
  // } catch (error) {
  //   if (error instanceof Anthropic.AuthenticationError) {
  //     console.error('Invalid or missing ANTHROPIC_API_KEY');
  //   } else if (error instanceof Anthropic.RateLimitError) {
  //     console.error('Rate limited - retry later');
  //   } else if (error instanceof Anthropic.APIError) {
  //     console.error(`Anthropic API error ${error.status}:`, error.message);
  //   } else {
  //     console.error(error);
  //   }


    // ================= predefined Server tools :

    // web search
    const websearch_tool_response = await client.messages.create({
      model: "claude-opus-5",
      max_tokens: 1024,
      tools: [{"type": "web_search_20260209", "name": "web_search"}],
      messages: [
          {"role": "user", "content": query}
      ],
    });

    const resp1 = websearch_tool_response.content
      .filter((block): block is Anthropic.TextBlock => block.type === 'text')
      .map((block) => block.text)
      .join('\n');

    // code execution
    const codexec_tool_response = await client.messages.create({
      model: "claude-opus-5",
      max_tokens: 1024,
      tools: [{"type": "code_execution_20260120", "name": "code_execution"}],
      messages: [
          {"role": "user", "content": query}
      ],
    });

  const resp2 = codexec_tool_response.content
      .filter((block): block is Anthropic.TextBlock => block.type === 'text')
      .map((block) => block.text)
      .join('\n');

      console.log(">>>>>>>>>>>..", [resp1, resp2].filter(Boolean).join('\n') );

    return [resp1, resp2].filter(Boolean).join('\n');
  } catch (error) {
    if (error instanceof Anthropic.AuthenticationError) {
      console.error('Invalid or missing ANTHROPIC_API_KEY');
    } else if (error instanceof Anthropic.RateLimitError) {
      console.error('Rate limited - retry later');
    } else if (error instanceof Anthropic.APIError) {
      console.error(`Anthropic API error ${error.status}:`, error.message);
    } else {
      console.error(error);
    }

    return 'Something went wrong talking to the chatbot.';
  }
}
