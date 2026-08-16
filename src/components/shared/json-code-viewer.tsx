import { useMemo, useState } from "react";
import { Braces, Check, Copy } from "lucide-react";
import SyntaxHighlighter from "react-syntax-highlighter/dist/esm/prism-light";
import json from "react-syntax-highlighter/dist/esm/languages/prism/json";

import { ScrollArea } from "@/components/ui/scroll-area";
import { cn, copyToClipboard, stringifyJsonForDisplay } from "@/lib/utils";

SyntaxHighlighter.registerLanguage("json", json);

const MONO = '"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace';

// Brand-cohesive syntax theme driven by the --json-* CSS variables (see
// index.css), so the viewer matches the app palette in both cream light and
// deep dark modes and updates live with the theme — instead of the stark VS Code
// white / #1e1e1e that clashed with the app's surfaces.
const jsonStyle: Record<string, React.CSSProperties> = {
  'code[class*="language-"]': {
    color: "hsl(var(--foreground) / 0.9)",
    background: "none",
    fontFamily: MONO,
    fontSize: "12.5px",
    lineHeight: 1.7,
    textShadow: "none",
    whiteSpace: "pre-wrap",
    wordBreak: "break-word",
    tabSize: 2,
  },
  'pre[class*="language-"]': {
    color: "hsl(var(--foreground) / 0.9)",
    background: "none",
    margin: 0,
    textShadow: "none",
  },
  property: { color: "hsl(var(--json-key))", fontWeight: 500 },
  string: { color: "hsl(var(--json-string))" },
  number: { color: "hsl(var(--json-number))" },
  boolean: { color: "hsl(var(--json-atom))" },
  null: { color: "hsl(var(--json-atom))", fontStyle: "italic" },
  keyword: { color: "hsl(var(--json-atom))" },
  punctuation: { color: "hsl(var(--json-punct))" },
  operator: { color: "hsl(var(--json-punct))" },
};

function byteLength(text: string): string {
  const bytes = new Blob([text]).size;
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/** Pretty-printed, syntax-highlighted raw JSON — a clean, theme-cohesive code
 * panel (brand token colors, soft surface, no line-number gutter). */
export function JsonCodeViewer({ data, className }: { data: unknown; className?: string }) {
  const [copyState, setCopyState] = useState<"idle" | "copied" | "failed">("idle");
  const text = useMemo(() => stringifyJsonForDisplay(data), [data]);
  const meta = useMemo(() => {
    const lines = text.split("\n").length;
    return `${lines.toLocaleString()} lines · ${byteLength(text)}`;
  }, [text]);

  async function copy() {
    const ok = await copyToClipboard(text);
    setCopyState(ok ? "copied" : "failed");
    setTimeout(() => setCopyState("idle"), 1500);
  }

  return (
    <div className={cn("overflow-hidden rounded-xl border border-border bg-card", className)}>
      <div className="flex items-center justify-between border-b border-border/70 bg-muted/40 px-3 py-2">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Braces className="h-3.5 w-3.5 text-primary" />
          <span className="text-xs font-medium text-foreground">JSON</span>
          <span className="hidden text-[11px] tabular-nums text-muted-foreground/70 sm:inline">{meta}</span>
        </div>
        <button
          type="button"
          onClick={copy}
          className={cn(
            "inline-flex h-7 items-center gap-1.5 rounded-md px-2 text-xs font-medium transition-colors duration-150 ease-out hover:bg-accent",
            copyState === "failed" ? "text-destructive" : "text-muted-foreground hover:text-foreground",
          )}
        >
          {copyState === "copied" ? (
            <Check className="h-3.5 w-3.5 text-success" />
          ) : (
            <Copy className="h-3.5 w-3.5" />
          )}
          {copyState === "copied" ? "Copied" : copyState === "failed" ? "Copy failed" : "Copy"}
        </button>
      </div>
      <ScrollArea className="h-[42vh]">
        <SyntaxHighlighter
          language="json"
          style={jsonStyle}
          wrapLongLines
          customStyle={{
            background: "transparent",
            margin: 0,
            padding: "0.875rem 1rem",
            fontSize: "12.5px",
            lineHeight: 1.7,
            fontFamily: MONO,
            overflowX: "hidden",
            overflowWrap: "anywhere",
            wordBreak: "break-word",
          }}
          codeTagProps={{ style: { fontFamily: "inherit" } }}
        >
          {text}
        </SyntaxHighlighter>
      </ScrollArea>
    </div>
  );
}
