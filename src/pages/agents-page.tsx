import { useEffect, useRef, useState } from "react";
import {
  Bot,
  Database,
  ListChecks,
  Network,
  Settings,
  Sparkles,
  SquarePen,
} from "lucide-react";
import { toast } from "sonner";

import { ChatComposer } from "@/components/agents/chat-composer";
import { ChatMessage } from "@/components/agents/chat-message";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { usePolledResource } from "@/hooks/use-polled-resource";
import {
  AgentStreamError,
  getAgentConversation,
  getAgentSettings,
  listAgentConversations,
  streamAgentChat,
} from "@/lib/agents-api";
import { ApiError } from "@/lib/api";
import { cn, formatRelativeTime, generateId } from "@/lib/utils";
import { useAgentChatStore } from "@/store/agent-chat-store";
import { useSettingsDialogStore } from "@/store/settings-dialog-store";
import type { AgentMessage, AgentTraceStep } from "@/lib/types";

// Appends a token delta to the message's trailing text part, or starts a new
// one if the last part is a trace step (a tool call/result landed since the
// previous token) — keeps streamed text and steps in the order they actually
// happened rather than in two separate buckets.
function appendToken(message: AgentMessage, content: string): AgentMessage {
  const parts = message.parts.slice();
  const last = parts[parts.length - 1];
  if (last?.kind === "text") {
    parts[parts.length - 1] = { ...last, text: last.text + content };
  } else {
    parts.push({ kind: "text", id: generateId(), text: content });
  }
  return { ...message, parts, pending: false };
}

// A "result" step shares its id with the "call" step it resolves — update
// that chip in place (spinner -> checkmark) instead of appending a second,
// separate entry for the same tool invocation.
function appendStep(message: AgentMessage, step: AgentTraceStep): AgentMessage {
  const existingIndex = message.parts.findIndex((p) => p.kind === "step" && p.id === step.id);
  if (existingIndex !== -1) {
    const parts = message.parts.slice();
    parts[existingIndex] = { kind: "step", id: step.id, step };
    return { ...message, parts, pending: false };
  }
  return { ...message, parts: [...message.parts, { kind: "step", id: step.id, step }], pending: false };
}

const SUGGESTIONS = [
  {
    icon: Database,
    title: "Extract structured data",
    prompt: "Crawl example.com and extract every blog post title and publish date",
  },
  {
    icon: Network,
    title: "Map an entire site",
    prompt: "Start a sitemap crawl of docs.example.com limited to 200 URLs",
  },
  {
    icon: Sparkles,
    title: "Scrape & summarize",
    prompt: "Scrape the homepage of example.com and summarize what the company does",
  },
  {
    icon: ListChecks,
    title: "Check a crawl",
    prompt: "What's the status of my most recent crawl?",
  },
];

export default function AgentsPage() {
  const conversations = useAgentChatStore((s) => s.conversations);
  const setConversations = useAgentChatStore((s) => s.setConversations);
  const activeId = useAgentChatStore((s) => s.activeId);
  const setActiveId = useAgentChatStore((s) => s.setActiveId);
  const setConversationsLoading = useAgentChatStore((s) => s.setLoading);
  const openSettings = useSettingsDialogStore((s) => s.openSettings);
  const [messages, setMessages] = useState<AgentMessage[]>([]);
  const [loadingConversation, setLoadingConversation] = useState(false);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const activeIdRef = useRef<string | null>(null);
  const scrollAnchorRef = useRef<HTMLDivElement>(null);
  // Messages restored from history shouldn't replay their entrance animation
  // every time a conversation loads (or the tab is revisited) — only ones
  // actually streamed in live during this session should fade/slide in.
  const historicalIdsRef = useRef<Set<string>>(new Set());

  const { data: settings } = usePolledResource(getAgentSettings, { cacheKey: "agents:settings" });
  const isConfigured = settings?.llm.hasKey ?? false;

  // Seeds the conversation list from the backend on first mount so the
  // sidebar is populated, and opens on a fresh, unsaved chat rather than
  // auto-loading the most recent conversation — its history only tracks
  // conversations that have received at least one message, and this one
  // becomes real the moment the first message is sent. The one exception:
  // the Sidebar's history is reachable from every page now, and clicking a
  // conversation there while this page isn't mounted stashes its id as
  // `pendingSelectId` instead of calling `selectConversation` directly —
  // consume that here so navigating in from elsewhere opens the right chat.
  useEffect(() => {
    const pendingId = useAgentChatStore.getState().pendingSelectId;
    if (pendingId) {
      useAgentChatStore.getState().setPendingSelectId(null);
      setActiveId(pendingId);
      activeIdRef.current = pendingId;
      loadConversation(pendingId);
    } else {
      const id = generateId();
      setActiveId(id);
      activeIdRef.current = id;
    }

    listAgentConversations()
      .then(setConversations)
      .catch(() => {})
      .finally(() => setConversationsLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    // `html` sets `scroll-behavior: smooth` globally (an inherited CSS
    // property), which would otherwise make this scrollIntoView animate on
    // every render — most jarringly on the very first jump to the bottom of
    // a loaded conversation, which reads as the whole chat sliding up into
    // place instead of just appearing.
    scrollAnchorRef.current?.scrollIntoView({ block: "end", behavior: "instant" });
  }, [messages]);

  useEffect(() => {
    return () => abortRef.current?.abort();
  }, []);

  // Lets the global Sidebar drive selection while this page owns the actual
  // conversation data and streaming logic — see agent-chat-store.ts.
  useEffect(() => {
    useAgentChatStore.getState().setSelectHandler(selectConversation);
    return () => useAgentChatStore.getState().setSelectHandler(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeId]);

  function loadConversation(id: string) {
    setLoadingConversation(true);
    getAgentConversation(id)
      .then(({ messages: loaded }) => {
        if (activeIdRef.current !== id) return;
        historicalIdsRef.current = new Set(loaded.map((m) => m.id));
        setMessages(loaded);
      })
      .catch((err) => {
        if (activeIdRef.current !== id) return;
        toast.error("Couldn't load that conversation", {
          description: err instanceof ApiError ? err.message : "Lost connection to the agent.",
        });
      })
      .finally(() => {
        if (activeIdRef.current === id) setLoadingConversation(false);
      });
  }

  function selectConversation(id: string) {
    if (id === activeId) return;
    abortRef.current?.abort();
    setIsStreaming(false);
    setActiveId(id);
    activeIdRef.current = id;
    setMessages([]);
    historicalIdsRef.current = new Set();
    loadConversation(id);
  }

  function handleNewChat() {
    abortRef.current?.abort();
    setIsStreaming(false);
    const id = generateId();
    setActiveId(id);
    activeIdRef.current = id;
    setMessages([]);
    historicalIdsRef.current = new Set();
    setLoadingConversation(false);
  }

  function send(text: string) {
    const trimmed = text.trim();
    if (!trimmed || isStreaming || !activeId) return;
    if (!isConfigured) {
      toast.error("Configure the agent first", {
        description: "Add an LLM provider and API key under Settings › Agent Config.",
      });
      return;
    }
    const conversationId = activeId;

    const userMessage: AgentMessage = {
      id: generateId(),
      role: "user",
      parts: [{ kind: "text", id: generateId(), text: trimmed }],
      createdAt: Date.now(),
    };
    const assistantId = generateId();
    const assistantMessage: AgentMessage = {
      id: assistantId,
      role: "assistant",
      parts: [],
      createdAt: Date.now(),
      pending: true,
    };

    setMessages((prev) => [...prev, userMessage, assistantMessage]);
    setInput("");
    setIsStreaming(true);

    const controller = new AbortController();
    abortRef.current = controller;

    function updateAssistant(transform: (m: AgentMessage) => AgentMessage) {
      setMessages((prev) => prev.map((m) => (m.id === assistantId ? transform(m) : m)));
    }

    streamAgentChat({
      conversationId,
      message: trimmed,
      signal: controller.signal,
      onEvent: (event) => {
        if (event.type === "token") {
          updateAssistant((m) => appendToken(m, event.content));
        } else if (event.type === "step") {
          updateAssistant((m) => appendStep(m, event.step));
        } else if (event.type === "error") {
          updateAssistant((m) => ({ ...m, error: event.message, pending: false }));
        }
      },
    })
      .catch((err) => {
        if (controller.signal.aborted) return;
        const message = err instanceof AgentStreamError ? err.message : "Lost connection to the agent.";
        updateAssistant((m) => ({ ...m, error: message, pending: false }));
        toast.error("Agent request failed", { description: message });
      })
      .finally(() => {
        setIsStreaming(false);
        abortRef.current = null;
        // The backend creates/renames the conversation server-side as part of
        // handling the turn — refresh the list so a brand-new chat appears
        // (and an existing one's title/recency updates) once it's done.
        listAgentConversations()
          .then(setConversations)
          .catch(() => {});
      });
  }

  function handleStop() {
    abortRef.current?.abort();
    setIsStreaming(false);
    setMessages((prev) =>
      prev.map((m, i) => (i === prev.length - 1 && m.role === "assistant" ? { ...m, pending: false } : m)),
    );
  }

  const hasMessages = messages.length > 0;
  const activeConversation = conversations.find((c) => c.id === activeId);
  // Composer lives centered inside the hero on an empty chat (modern AI-app
  // pattern), then drops to the bottom the moment a conversation has content.
  const composer = (
    <ChatComposer
      value={input}
      onChange={setInput}
      onSubmit={() => send(input)}
      onStop={handleStop}
      isStreaming={isStreaming}
      disabled={!isConfigured}
      placeholder={isConfigured ? undefined : "Configure the agent in Settings to start chatting"}
      autoFocus={isConfigured && !isStreaming && !loadingConversation}
    />
  );

  return (
    <div className="-my-6 flex h-[calc(100dvh-3.5rem)] lg:-my-8">
      {/* At lg+ this history lives in the persistent Sidebar; below that, the
          top bar's logo opens the same content (nav + this history + account)
          in a Sheet — see topbar.tsx / sidebar-content.tsx — so this page
          doesn't need its own separate history entry point anymore. */}
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex h-12 shrink-0 items-center gap-2 border-b border-border px-3">
          <div className="flex min-w-0 flex-1 items-center gap-2">
            <span className="relative flex h-2 w-2 shrink-0">
              {isStreaming && (
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
              )}
              <span
                className={cn(
                  "relative inline-flex h-2 w-2 rounded-full",
                  isConfigured ? "bg-primary" : "bg-muted-foreground/40",
                )}
              />
            </span>
            <span className="truncate text-sm font-medium text-foreground">
              {settings?.llm.model || "Agent"}
            </span>
            <span className="hidden text-xs text-muted-foreground sm:inline">
              {isStreaming
                ? "· working…"
                : hasMessages && activeConversation
                  ? `· ${formatRelativeTime(new Date(activeConversation.updatedAt))}`
                  : "· ready"}
            </span>
          </div>

          <Button
            variant="ghost"
            size="icon"
            className="shrink-0"
            onClick={handleNewChat}
            aria-label="New chat"
          >
            <SquarePen className="h-4 w-4" />
          </Button>
        </div>

        {loadingConversation ? (
          <div className="flex-1" />
        ) : !hasMessages ? (
          <div className="relative flex flex-1 flex-col items-center justify-center overflow-hidden px-4">
            {/* Ambient copper glow behind the hero. A radial-gradient rather
                than a blurred circle: `blur-3xl` forces a costly re-rasterize on
                every frame of the page-enter slide (the transform is on an
                ancestor), which is what made the tab open janky. A gradient
                composites cheaply. Static (no keyframes), so it's also inert
                under reduce-motion without extra handling. */}
            <div
              aria-hidden
              className="pointer-events-none absolute left-1/2 top-[38%] h-[32rem] w-[32rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,hsl(var(--primary)/0.16),hsl(var(--gradient-to)/0.09)_55%,transparent_75%)]"
            />

            {!isConfigured ? (
              <div className="relative flex flex-col items-center gap-4 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-copper-soft text-primary ring-1 ring-primary/20">
                  <Bot className="h-7 w-7" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-foreground">Configure the agent to get started</h2>
                  <p className="mt-1.5 max-w-sm text-sm text-muted-foreground">
                    It needs its own LLM provider and API key before it can plan and run crawls for you.
                  </p>
                </div>
                <Button size="sm" onClick={openSettings}>
                  <Settings className="h-3.5 w-3.5" />
                  Configure agent
                </Button>
              </div>
            ) : (
              <div className="relative flex w-full max-w-2xl flex-col items-center gap-6">
                <div className="flex flex-col items-center gap-3 text-center">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-copper-soft text-primary ring-1 ring-primary/20">
                    <Bot className="h-7 w-7" />
                  </div>
                  <h2 className="text-2xl font-semibold tracking-tight">
                    What are we <span className="text-gradient">crawling</span> today?
                  </h2>
                  <p className="max-w-md text-sm text-muted-foreground">
                    Describe a site and what to pull from it — the agent plans the crawl, runs it, and reports back.
                  </p>
                </div>

                <div className="w-full">{composer}</div>

                <div className="grid w-full grid-cols-1 gap-2 sm:grid-cols-2">
                  {SUGGESTIONS.map((s) => (
                    <button
                      key={s.title}
                      type="button"
                      onClick={() => send(s.prompt)}
                      className="group flex items-start gap-3 rounded-2xl border border-border bg-card/50 p-3 text-left transition-colors duration-150 ease-out hover:border-primary/40 hover:bg-accent"
                    >
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-copper-soft text-primary transition-[filter] duration-150 ease-out group-hover:brightness-125">
                        <s.icon className="h-4 w-4" />
                      </span>
                      <span className="min-w-0">
                        <span className="block text-sm font-medium text-foreground">{s.title}</span>
                        <span className="mt-0.5 block truncate text-xs text-muted-foreground">{s.prompt}</span>
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <ScrollArea className="flex-1">
            <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-4 py-6">
              {messages.map((m) => (
                <ChatMessage key={m.id} message={m} animate={!historicalIdsRef.current.has(m.id)} />
              ))}
              <div ref={scrollAnchorRef} />
            </div>
          </ScrollArea>
        )}

        {hasMessages && (
          <div className="mx-auto w-full max-w-2xl px-4 pb-4 pt-2">
            {composer}
            <p className="mt-2 text-center text-xs text-muted-foreground">
              The agent can make mistakes — check crawl results before relying on them.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
