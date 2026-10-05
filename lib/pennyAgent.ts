import "server-only";
import Anthropic from "@anthropic-ai/sdk";

/**
 * Penny via Claude Managed Agents. Each "Can I afford this?" turn runs in a short session on the
 * user's agent (its own system prompt = Penny's training). The app sends the live numbers, the
 * conversation so far and any photo, and asks for the same JSON the rest of the app expects.
 *
 * Env:
 *   PENNY_AGENT_ID           the agent to use (defaults to Penny's agent below)
 *   ANTHROPIC_ENVIRONMENT_ID optional; otherwise an environment named "penny" is found or created once
 */
export const PENNY_AGENT_ID = process.env.PENNY_AGENT_ID || "agent_01GZ9g1famujx7KVZqZiWkjZ";

const ENV_NAME = "penny";
let environmentId: Promise<string> | null = null;

/** Reuse one environment for every session (created once, then found by name). */
function getEnvironmentId(client: Anthropic): Promise<string> {
  if (process.env.ANTHROPIC_ENVIRONMENT_ID) return Promise.resolve(process.env.ANTHROPIC_ENVIRONMENT_ID);
  environmentId ??= (async () => {
    for await (const env of client.beta.environments.list()) {
      if (env.name === ENV_NAME) return env.id;
    }
    const env = await client.beta.environments.create({ name: ENV_NAME, config: { type: "cloud" } });
    console.info("[penny-agent] created environment", env.id, "(set ANTHROPIC_ENVIRONMENT_ID to pin it)");
    return env.id;
  })().catch((err) => {
    environmentId = null; // retry on the next request
    throw err;
  });
  return environmentId;
}

type Image = { mediaType: "image/jpeg" | "image/png" | "image/webp" | "image/gif"; data: string };

/** Run one turn on the agent and return its reply text. Throws on failure or timeout. */
export async function askPennyAgent(client: Anthropic, prompt: string, image: Image | null, timeoutMs: number): Promise<string> {
  const environment_id = await getEnvironmentId(client);
  const session = await client.beta.sessions.create({ agent: PENNY_AGENT_ID, environment_id, title: "Can I afford this?" });

  const content: Anthropic.Beta.Sessions.BetaManagedAgentsUserMessageEventParams["content"] = [];
  if (image) content.push({ type: "image", source: { type: "base64", media_type: image.mediaType, data: image.data } });
  content.push({ type: "text", text: prompt });

  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    // Stream-first: open the stream and send the message together, so no events are missed.
    const [text] = await Promise.all([
      (async () => {
        const stream = await client.beta.sessions.events.stream(session.id, {}, { signal: ctrl.signal });
        let reply = "";
        for await (const event of stream) {
          if (event.type === "agent.message") {
            for (const block of event.content) if (block.type === "text") reply += block.text;
          } else if (event.type === "session.status_idle" || event.type === "session.status_terminated") {
            break;
          }
        }
        return reply;
      })(),
      client.beta.sessions.events.send(session.id, { events: [{ type: "user.message", content }] }),
    ]);
    return text;
  } finally {
    clearTimeout(timer);
    // One session per turn; tidy it up without slowing the reply.
    client.beta.sessions.archive(session.id).catch(() => {});
  }
}
