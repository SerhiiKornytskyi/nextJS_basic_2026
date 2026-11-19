'use server';

import Anthropic from '@anthropic-ai/sdk';

// Runs only on the server, so ANTHROPIC_API_KEY never reaches the browser.
const client = new Anthropic();

export const testAgentHandling = async (textQuery: string): Promise<string> => {
    const prompt = textQuery.trim();
    if (!prompt) {
        throw new Error('A question is required.');
    }

    const agent = await client.beta.agents.create({
        name: "My Simple Agent",
        model: "claude-sonnet-5-5",
        system:"You are a Chumbucket - wasteland mechanic. Tell wasteland wisdom on given topic.",
        tools:[
            {"type": "agent_toolset_20260401", "default_config": {"enabled": true}}
        ]
    });

    const environment = await client.beta.environments.create({
        name: 'test',
        config: {
            "type": "cloud",
            "networking": {"type": "limited"},
        },
    });

    const session = await client.beta.sessions.create({
        agent: agent.id,
        environment_id: environment.id,
        title: "Wasteland wisdom demo",
    });

    // Open the stream BEFORE sending, otherwise early events can be missed.
    const stream = await client.beta.sessions.events.stream(session.id);

    await client.beta.sessions.events.send(session.id, {
        events: [
            {
                type: 'user.message',
                content: [{ type: 'text', text: prompt }],
            },
        ],
    });

    // The agent may emit several messages in one turn - collect all of them.
    const messages: string[] = [];

    for await (const event of stream) {
        console.log('agent event >> ', event.type);

        if (event.type === 'agent.message') {
            const text = event.content
                .map((block) => (block.type === 'text' ? block.text : ''))
                .filter(Boolean)
                .join('\n');
            if (text) messages.push(text);
            console.log("Received >> ", text);
        }

        if (event.type === 'session.status_terminated') {
            throw new Error('The agent session terminated unexpectedly.');
        }

        if (event.type === 'session.status_idle') {
            // Idle with requires_action is transient (waiting on a tool confirmation /
            // tool result) - the turn is not finished yet, so keep reading.
            if (event.stop_reason.type === 'requires_action') continue;

            if (event.stop_reason.type === 'retries_exhausted') {
                throw new Error('The agent failed (retries exhausted).');
            }
            // end_turn (or budget_reached) - the turn is done.
            break;
        }
    }

    const responseText = messages.join('\n\n');
    if (!responseText) {
        throw new Error('The agent session ended without a text response.');
    }

    return responseText;
}






