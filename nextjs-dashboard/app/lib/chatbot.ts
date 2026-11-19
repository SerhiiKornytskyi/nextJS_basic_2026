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
    // context_management (compaction) is beta-only, so this call uses client.beta.messages
    const websearch_tool_response = await client.beta.messages.create({
      model: "claude-opus-5",
      max_tokens: 1024,
      betas: ["compact-2026-01-12"],
      tools: [{"type": "web_search_20260209", "name": "web_search"}],
      context_management: {
          "edits": [
              {"type": "compact_20260112"}
          ]
      },
      messages: [
          {"role": "user", "content": query}
      ],
    });

    const resp1 = websearch_tool_response.content
      .filter((block): block is Anthropic.Beta.BetaTextBlock => block.type === 'text')
      .map((block) => block.text)
      .join('\n');

    // code execution
    // MCP connector is beta-only, so this call uses client.beta.messages + the mcp-client beta
    const codexec_tool_response = await client.beta.messages.create({
      model: "claude-opus-5",
      max_tokens: 1024,
      betas: ["mcp-client-2025-11-20"],
      // adding MCP server
      // mcp_servers: [
      //     {
      //         type: "url",
      //         url: "https://mcp.linear.app/mcp",
      //         name: "linear",
      //         authorization_token: process.env.LINEAR_MCP_TOKEN,
      //     }
      // ],
      // adding skills programmatically: 
      container: {
        skills: [
          // {
          //   type: "anthropic",
          //   skill_id: "xlsx",
          //   version: 'latest'
          // },
          // Anthropic pre-built skill: skill_id is the skill's short name
          // (available: "pptx", "xlsx", "docx", "pdf"), no upload needed.
          {
            type: "anthropic",
            skill_id: "pptx",
            version: 'latest'
          },
        ]
      },
      // Skills run inside code execution, so this tool is required alongside container.skills
      // tools: [
      //   // {"type": "code_execution_20260521", "name": "code_execution"},
      //   // // exposes the "linear" MCP server's tools (must match mcp_servers[].name)
      //   // {"type": "mcp_toolset", "mcp_server_name": "linear"},
       
      // {
      //     "type": "mcp_toolset",
      //     "mcp_server_name": "slack",
      //     "default_config": {
      //         "enabled": false,
      //     },
      //     "configs": {
      //         "search_messages": {"enabled": true},
      //         "list_channels": {"enabled": true},
      //     },
      // }
      // ],
      messages: [
          {"role": "user", "content": query}
      ],
    });

  const resp2 = codexec_tool_response.content
      .filter((block): block is Anthropic.Beta.BetaTextBlock => block.type === 'text')
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
