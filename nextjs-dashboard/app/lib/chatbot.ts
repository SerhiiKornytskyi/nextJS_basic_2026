'use server';

import Anthropic from '@anthropic-ai/sdk';

// Chat message example: 
// Runs only on the server, so ANTHROPIC_API_KEY never reaches the browser.
const client = new Anthropic();

export async function askChatbot(query: string): Promise<string> {
  if (!query.trim()) return '';

  try {
    const response = await client.messages.create({
      model: 'claude-haiku-5-5',
      max_tokens: 1024,
      system: 'You are a helpful Chumbucket from mad max - a wasteland mechanic.',
      messages: [{ role: 'user', content: query }],
    });

    if (response.stop_reason === 'refusal') {
      return 'The model declined to answer that.';
    }

    return response.content
      .filter((block): block is Anthropic.TextBlock => block.type === 'text')
      .map((block) => block.text)
      .join('\n');
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
