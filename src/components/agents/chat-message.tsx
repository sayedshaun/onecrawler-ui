import { useState } from "react";
import { motion } from "framer-motion";
import { Check, Copy, TriangleAlert } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import { AgentTraceStepView } from "@/components/agents/agent-trace-step";
import { cn, copyToClipboard } from "@/lib/utils";
import type { AgentMessage } from "@/lib/types";

function ThinkingIndicator() {
  return (
    <span className="flex items-center gap-2 py-1.5 text-sm text-muted-foreground">
      <span className="flex items-center gap-1">
        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground [animation-delay:-0.2s]" />
        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground [animation-delay:-0.1s]" />
        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground" />
      </span>
      Thinking…
    </span>
  );
}

function CopyReplyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    const ok = await copyToClipboard(text);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }
  }

  return (
    <button
      type="button"
      onClick={copy}
      className="inline-flex items-center gap-1 rounded-md px-1.5 py-1 text-xs text-muted-foreground opacity-0 transition-opacity duration-150 ease-out hover:bg-accent hover:text-foreground group-hover:opacity-100"
    >
      {copied ? <Check className="h-3.5 w-3.5 text-success" /> : <Copy className="h-3.5 w-3.5" />}
      {copied ? "Copied" : "Copy"}
    </button>
  );
}

// ChatGPT-style turn: the user's message sits in a right-aligned bubble: the
// assistant's reply is plain text with no bubble/avatar, since it's the only
// thing on its side of the column and doesn't need a container to read as
// "the response."
export function ChatMessage({ message, animate = true }: { message: AgentMessage; animate?: boolean }) {
  const isUser = message.role === "user";

  // The agent is "thinking" again once pending and its last visible part is
  // a finished step (or there's nothing yet) — a step still in flight already
  // shows its own spinner, and a trailing text part is itself the live output,
  // so neither needs this separate indicator on top.
  const lastPart = message.parts[message.parts.length - 1];
  const showThinking =
    message.pending && (!lastPart || (lastPart.kind === "step" && lastPart.step.kind === "result"));

  const replyText = message.parts
    .filter((p) => p.kind === "text")
    .map((p) => p.text)
    .join("\n\n");
  const canCopy = !isUser && !message.pending && replyText.trim().length > 0;

  return (
    <motion.div
      initial={animate ? { opacity: 0, y: 6 } : false}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className={cn("group flex", isUser && "justify-end")}
    >
      <div className={cn("flex flex-col gap-2", isUser ? "max-w-[85%] items-end sm:max-w-[75%]" : "w-full")}>
        {message.parts.map((part) =>
          part.kind === "step" ? (
            <AgentTraceStepView key={part.id} step={part.step} />
          ) : isUser ? (
            <div key={part.id} className="rounded-3xl bg-muted px-4 py-2.5 text-sm">
              <p className="whitespace-pre-wrap">{part.text}</p>
            </div>
          ) : (
            <div key={part.id} className="prose prose-sm max-w-none text-sm dark:prose-invert">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{part.text}</ReactMarkdown>
            </div>
          ),
        )}

        {showThinking && <ThinkingIndicator />}

        {message.error && (
          <div className="flex items-center gap-1.5 text-xs text-destructive">
            <TriangleAlert className="h-3.5 w-3.5 shrink-0" />
            {message.error}
          </div>
        )}

        {canCopy && <CopyReplyButton text={replyText} />}
      </div>
    </motion.div>
  );
}
