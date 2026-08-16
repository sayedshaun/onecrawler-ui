import { useState } from "react";
import { Check, Copy } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn, copyToClipboard, stringifyJsonForDisplay } from "@/lib/utils";

export function JsonPreview({ value, className }: { value: unknown; className?: string }) {
  const [copyState, setCopyState] = useState<"idle" | "copied" | "failed">("idle");
  const json = stringifyJsonForDisplay(value);

  async function copy() {
    const ok = await copyToClipboard(json);
    setCopyState(ok ? "copied" : "failed");
    setTimeout(() => setCopyState("idle"), 1500);
  }

  return (
    <div className={cn("relative", className)}>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className={cn(
          "absolute right-2 top-2 h-7 gap-1.5 text-xs",
          copyState === "failed" ? "text-destructive" : "text-muted-foreground",
        )}
        onClick={copy}
      >
        {copyState === "copied" ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
        {copyState === "copied" ? "Copied" : copyState === "failed" ? "Copy failed" : "Copy"}
      </Button>
      <ScrollArea className="border border-border bg-muted/40 h-72 rounded-lg">
        <pre className="p-4 font-mono text-[11px] leading-relaxed text-foreground/90">{json}</pre>
      </ScrollArea>
    </div>
  );
}
