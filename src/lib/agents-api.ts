import { apiFetch } from "@/lib/api";
import type {
  AgentConversationSummary,
  AgentLLMProvider,
  AgentMessage,
  AgentSettings,
  AgentTraceStep,
} from "@/lib/types";
import { generateId, stringifyJsonForDisplay } from "@/lib/utils";
import { useAuthStore } from "@/store/auth-store";

// The agent's chat/settings endpoints live on the same onecrawler-backend
// origin as everything else in src/lib/*-api.ts, under /api/v1.
const AGENTS_API_BASE = "/api/v1";

export class AgentStreamError extends Error {}

export type AgentStreamEvent =
  | { type: "token"; content: string }
  | { type: "step"; step: AgentTraceStep }
  | { type: "done" }
  | { type: "error"; message: string };

interface StreamAgentChatOptions {
  conversationId: string;
  message: string;
  signal?: AbortSignal;
  onEvent: (event: AgentStreamEvent) => void;
}

async function readErrorDetail(res: Response): Promise<string> {
  try {
    const body = await res.json();
    if (body?.detail) return typeof body.detail === "string" ? body.detail : JSON.stringify(body.detail);
  } catch {
    // response had no JSON body — fall back to statusText
  }
  return res.statusText;
}

// The agent's own todo-list planning tool (injected by the deepagents
// TodoListMiddleware) — surfaced as "planning" in the UI rather than a
// generic tool call, since it's the closest thing to a distinct plan step
// this ReAct-style graph has.
const PLANNING_TOOL_NAME = "write_todos";

// Tool call args / tool result content are JSON when parseable — pretty-print
// them for the trace step's expandable detail; fall back to the raw string.
function formatDetail(value: unknown): string | undefined {
  if (value == null) return undefined;
  if (typeof value === "string") {
    try {
      return stringifyJsonForDisplay(JSON.parse(value));
    } catch {
      return value || undefined;
    }
  }
  return stringifyJsonForDisplay(value);
}

// Tool results come back as a string (JSON-stringified if the tool returned
// an object) — best-effort pull a crawl job id out of it so the UI can link
// straight to that crawl's detail page.
function extractJobId(content: unknown): string | undefined {
  let value = content;
  if (typeof value === "string") {
    try {
      value = JSON.parse(value);
    } catch {
      return undefined;
    }
  }
  if (value && typeof value === "object") {
    const obj = value as Record<string, unknown>;
    for (const key of ["job_id", "jobId", "id"]) {
      if (typeof obj[key] === "string") return obj[key] as string;
    }
  }
  return undefined;
}

interface ChatToolMessage {
  kind: string;
  content: string;
  tool_calls?: { name: string; args: Record<string, unknown>; id: string }[];
  tool_call_id?: string;
  name?: string;
}

// Maps one SSE frame from POST /api/v1/chat/stream to zero or more UI
// events. The backend emits three named events (token, done, error) plus a
// fourth, unnamed one for tool-call/tool-result updates (one AIMessage can
// carry several tool_calls at once) — see onecrawler-backend's
// src/api/v1/agent/router.py for the exact frame shapes this mirrors. Plain
// assistant text never appears in the unnamed event — the backend already
// filters it out there since it's covered by `token` instead.
function mapFrame(eventType: string, payload: unknown): AgentStreamEvent[] {
  if (eventType === "token") {
    const delta = (payload as { delta?: string } | undefined)?.delta;
    return delta ? [{ type: "token", content: delta }] : [];
  }
  if (eventType === "done") return [{ type: "done" }];
  if (eventType === "error") {
    const message = (payload as { error?: string } | undefined)?.error;
    return [{ type: "error", message: message || "The agent hit an error." }];
  }

  const message = (payload as { message?: ChatToolMessage } | undefined)?.message;
  if (!message) return [];

  if (message.kind === "AIMessage" && message.tool_calls?.length) {
    return message.tool_calls.map((call) => ({
      type: "step",
      step: {
        id: call.id || generateId(),
        kind: "call",
        toolName: call.name,
        isPlanning: call.name === PLANNING_TOOL_NAME,
        detail: formatDetail(call.args),
      },
    }));
  }
  if (message.kind === "ToolMessage") {
    const name = message.name ?? "tool";
    return [
      {
        type: "step",
        step: {
          // Shares its id with the matching "call" step (the tool_call_id the
          // backend echoes back) so the UI updates that chip in place rather
          // than appending a second one for the same tool invocation.
          id: message.tool_call_id || generateId(),
          kind: "result",
          toolName: name,
          isPlanning: name === PLANNING_TOOL_NAME,
          detail: formatDetail(message.content),
          jobId: extractJobId(message.content),
        },
      },
    ];
  }
  return [];
}

/** Streams one chat turn from POST /api/v1/chat/stream (SSE). Requires the
 * user to have already saved an LLM provider/model/key via the agent settings
 * endpoints below — the backend 4xxs otherwise. */
export async function streamAgentChat({
  conversationId,
  message,
  signal,
  onEvent,
}: StreamAgentChatOptions): Promise<void> {
  const token = useAuthStore.getState().token;
  const res = await fetch(`${AGENTS_API_BASE}/chat/stream`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "ngrok-skip-browser-warning": "true",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ conversation_id: conversationId, message }),
    signal,
  });

  if (!res.ok || !res.body) {
    throw new AgentStreamError(await readErrorDetail(res));
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    const frames = buffer.split("\n\n");
    buffer = frames.pop() ?? "";

    for (const frame of frames) {
      let eventType = "message";
      const dataLines: string[] = [];
      for (const line of frame.split("\n")) {
        if (line.startsWith("event:")) eventType = line.slice(6).trim();
        else if (line.startsWith("data:")) dataLines.push(line.slice(5).trim());
      }
      if (dataLines.length === 0) continue;

      try {
        mapFrame(eventType, JSON.parse(dataLines.join("\n"))).forEach(onEvent);
      } catch {
        // malformed frame — skip it rather than aborting the whole stream
      }
    }
  }
}

interface AgentSettingsApi {
  llm: { provider: AgentLLMProvider | null; model: string | null; has_key: boolean };
  search: { provider: string | null; has_key: boolean };
  updated_at: string | null;
}

function settingsFromApi(raw: AgentSettingsApi): AgentSettings {
  return {
    llm: { provider: raw.llm.provider, model: raw.llm.model, hasKey: raw.llm.has_key },
    search: { provider: raw.search.provider, hasKey: raw.search.has_key },
    updatedAt: raw.updated_at,
  };
}

export function getAgentSettings(): Promise<AgentSettings> {
  return apiFetch<AgentSettingsApi>(`${AGENTS_API_BASE}/settings/agent`).then(settingsFromApi);
}

export function setAgentLLMConfig(input: {
  provider: AgentLLMProvider;
  model: string;
  apiKey: string;
}): Promise<AgentSettings> {
  return apiFetch<AgentSettingsApi>(`${AGENTS_API_BASE}/settings/agent`, {
    method: "PUT",
    body: JSON.stringify({ llm: { provider: input.provider, model: input.model, api_key: input.apiKey } }),
  }).then(settingsFromApi);
}

// "tavily" is the only search provider the backend currently supports —
// still accepted as a param in case that changes, defaulting to it either way.
export function setAgentSearchConfig(input: { apiKey: string; provider?: string }): Promise<AgentSettings> {
  return apiFetch<AgentSettingsApi>(`${AGENTS_API_BASE}/settings/agent`, {
    method: "PUT",
    body: JSON.stringify({ search: { provider: input.provider ?? "tavily", api_key: input.apiKey } }),
  }).then(settingsFromApi);
}

export function clearAgentConfig(scope?: "llm" | "search"): Promise<void> {
  const qs = scope ? `?scope=${scope}` : "";
  return apiFetch(`${AGENTS_API_BASE}/settings/agent${qs}`, { method: "DELETE" });
}

interface ConversationApi {
  conversation_id: string;
  title: string;
  updated_at: string;
}

// The backend stores each turn under the LangChain message kind that
// produced it ("human" / "ai" — see _record_turn in
// src/api/v1/agent/router.py), not the "user" / "assistant" naming this UI
// uses for its own locally-built turns — translated below.
interface ChatMessageApi {
  role: "human" | "ai";
  content: string;
  created_at: string;
}

interface ConversationDetailApi extends ConversationApi {
  messages: ChatMessageApi[];
}

function conversationFromApi(raw: ConversationApi): AgentConversationSummary {
  return { id: raw.conversation_id, title: raw.title, updatedAt: Date.parse(raw.updated_at) };
}

// The backend only stores each turn's final role/content — none of the
// tool-call/result trace steps a live stream shows — so a reloaded past
// conversation renders as plain text parts, without its original trace.
function messageFromApi(raw: ChatMessageApi): AgentMessage {
  return {
    id: generateId(),
    role: raw.role === "human" ? "user" : "assistant",
    parts: [{ kind: "text", id: generateId(), text: raw.content }],
    createdAt: Date.parse(raw.created_at),
  };
}

export function listAgentConversations(): Promise<AgentConversationSummary[]> {
  return apiFetch<ConversationApi[]>(`${AGENTS_API_BASE}/chats`).then((list) =>
    list.map(conversationFromApi).sort((a, b) => b.updatedAt - a.updatedAt),
  );
}

export function getAgentConversation(
  id: string,
): Promise<{ summary: AgentConversationSummary; messages: AgentMessage[] }> {
  return apiFetch<ConversationDetailApi>(`${AGENTS_API_BASE}/chats/${id}`).then((raw) => ({
    summary: conversationFromApi(raw),
    messages: raw.messages.map(messageFromApi),
  }));
}
