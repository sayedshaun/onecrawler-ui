import { useEffect, useRef, type KeyboardEvent } from "react";
import { Square, ArrowUp } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface ChatComposerProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  onStop: () => void;
  isStreaming: boolean;
  disabled?: boolean;
  placeholder?: string;
  autoFocus?: boolean;
}

export function ChatComposer({
  value,
  onChange,
  onSubmit,
  onStop,
  isStreaming,
  disabled,
  placeholder = "Tell the agent what to crawl, e.g. “Crawl example.com's blog and extract titles + dates”",
  autoFocus,
}: ChatComposerProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Grows with the content instead of scrolling inside a fixed one-line box —
  // reset to "auto" first so shrinking (e.g. after clearing on send) measures
  // the new, smaller scrollHeight rather than the previous taller one.
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, [value]);

  useEffect(() => {
    if (autoFocus) textareaRef.current?.focus();
  }, [autoFocus]);

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (!isStreaming && value.trim()) onSubmit();
    }
  }

  return (
    <div className="flex items-end gap-2 rounded-3xl border border-border bg-background p-2 pl-4 shadow-sm transition-[border-color,box-shadow] duration-200 focus-within:border-primary/60 focus-within:shadow-[0_0_0_4px_hsl(var(--primary)/0.1)]">
      <Textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        rows={1}
        disabled={disabled}
        className="min-h-9 max-h-40 flex-1 resize-none border-0 bg-transparent px-0 py-2 focus-visible:ring-0"
      />
      {isStreaming ? (
        <Button
          type="button"
          size="icon"
          variant="secondary"
          className="shrink-0 rounded-full"
          onClick={onStop}
          aria-label="Stop response"
        >
          <Square className="h-3.5 w-3.5 fill-current" />
        </Button>
      ) : (
        <Button
          type="button"
          size="icon"
          className="shrink-0 rounded-full"
          onClick={onSubmit}
          disabled={disabled || !value.trim()}
          aria-label="Send message"
        >
          <ArrowUp className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}
