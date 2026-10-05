import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { PENNY_AGENT_ID } from "./pennyAgent";

/**
 * One Anthropic client for the app, set up for whatever key is in ANTHROPIC_API_KEY.
 *
 * Some keys aren't scoped to a workspace, and the API then needs every request to name one
 * (the `anthropic-workspace-id` header). Instead of asking for that ID, we find it ourselves:
 * ANTHROPIC_WORKSPACE_ID if set, otherwise the workspace that Penny's agent lives in.
 */
let client: Promise<Anthropic> | null = null;

const OPTIONS = { timeout: 25_000, maxRetries: 1 } as const;

export function getClient(): Promise<Anthropic> {
  client ??= build().catch((err) => {
    client = null; // try again on the next request
    throw err;
  });
  return client;
}

async function build(): Promise<Anthropic> {
  const pinned = process.env.ANTHROPIC_WORKSPACE_ID;
  if (pinned) return withWorkspace(pinned);

  const plain = new Anthropic(OPTIONS);
  try {
    // Workspace-scoped keys just work.
    await plain.beta.agents.retrieve(PENNY_AGENT_ID);
    return plain;
  } catch (err) {
    if (!needsWorkspace(err)) return plain; // a different problem; let the real call report it
  }

  // Unscoped key: look through the organization's workspaces for the one with Penny's agent.
  const candidates: string[] = [];
  try {
    for await (const ws of plain.beta.organization.workspaces.list()) {
      if (!ws.archived_at) candidates.push(ws.id);
    }
  } catch (err) {
    console.error("[anthropic] couldn't list workspaces with this key", err instanceof Error ? err.message : err);
  }
  candidates.push("default");

  for (const id of candidates) {
    const scoped = withWorkspace(id);
    try {
      await scoped.beta.agents.retrieve(PENNY_AGENT_ID);
      console.info(`[anthropic] using workspace ${id} (set ANTHROPIC_WORKSPACE_ID to skip this lookup)`);
      return scoped;
    } catch {
      // not this one
    }
  }
  throw new Error("This API key isn't scoped to a workspace and Penny's agent wasn't found in any workspace it can see.");
}

function withWorkspace(id: string) {
  return new Anthropic({ ...OPTIONS, defaultHeaders: { "anthropic-workspace-id": id } });
}

function needsWorkspace(err: unknown) {
  return err instanceof Anthropic.APIError && err.status === 400 && /workspace/i.test(err.message);
}
