import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { AnimatePresence, motion, useInView, useReducedMotion } from "framer-motion";
import {
  Activity,
  ArrowRight,
  Bot,
  Check,
  CheckCircle2,
  Compass,
  FileJson,
  Filter,
  Gauge,
  Layers,
  LayoutTemplate,
  ListChecks,
  Loader2,
  MousePointerClick,
  Radar,
  ShieldCheck,
  Sparkles,
  Zap,
} from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
} from "recharts";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { LiveDot } from "@/components/shared/live-dot";
import { ThemeToggle } from "@/components/layout/theme-toggle";

const FEATURES = [
  {
    icon: Bot,
    title: "AI agent that crawls for you",
    description: "Describe what you want in plain English — the agent plans the crawl, runs it, and reports back.",
  },
  {
    icon: Compass,
    title: "Sitemap & link discovery",
    description: "Point OneCrawler at a domain and let it map sitemaps or follow links to find every page worth scraping.",
  },
  {
    icon: Layers,
    title: "Shallow, deep, or full crawler mode",
    description: "Pick the extraction strategy that matches the job — from a single page to an entire site.",
  },
  {
    icon: Sparkles,
    title: "Heuristic or GenAI extraction",
    description: "Extract with fast heuristics, or hand a page to an LLM with a structured output schema.",
  },
  {
    icon: Filter,
    title: "Composable content filters",
    description: "Chain by-date, by-keyword, by-extension, and by-similarity filters with AND/OR logic to scrape exactly what matters.",
  },
  {
    icon: LayoutTemplate,
    title: "Reusable crawl templates",
    description: "Save a crawl setup once — extraction, filters, proxies, browser behavior — and launch new crawls from it instantly.",
  },
  {
    icon: FileJson,
    title: "Browse, filter, and export results",
    description: "Search across every scraped item and export as Markdown, JSON, XML, or TEI — no post-processing required.",
  },
  {
    icon: ShieldCheck,
    title: "Proxy rotation built in",
    description: "Round-robin or random proxy rotation keeps long crawls running without getting blocked.",
  },
  {
    icon: MousePointerClick,
    title: "Human-like behavior",
    description: "Randomized delays, scrolling, and mouse movement make automated browsing look natural.",
  },
];

const STEPS = [
  {
    step: "01",
    title: "Point it at a URL",
    description: "Give OneCrawler a target and choose sitemap, link extraction, or full crawler mode.",
  },
  {
    step: "02",
    title: "Configure the strategy",
    description: "Set concurrency, filters, proxies, and an optional GenAI schema — or just use the defaults.",
  },
  {
    step: "03",
    title: "Get structured results",
    description: "Watch progress live, then pull clean, structured data out in the format you need.",
  },
];

function PublicNav() {
  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background">
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center gap-3 px-4 lg:px-8">
        <Link to="/" className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-copper text-primary-foreground">
            <Radar className="h-4 w-4" />
          </div>
          <span className="text-sm font-semibold tracking-tight text-foreground">OneCrawler</span>
        </Link>

        <nav className="ml-6 hidden items-center gap-6 text-sm text-muted-foreground sm:flex">
          <a href="#agent" className="transition-colors duration-150 ease-out hover:text-foreground">
            Agent
          </a>
          <a href="#features" className="transition-colors duration-150 ease-out hover:text-foreground">
            Features
          </a>
          <a href="#how-it-works" className="transition-colors duration-150 ease-out hover:text-foreground">
            How it works
          </a>
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <ThemeToggle />
          <Button asChild variant="ghost" size="sm">
            <Link to="/login">Log in</Link>
          </Button>
          <Button asChild size="sm">
            <Link to="/signup">Sign up free</Link>
          </Button>
        </div>
      </div>
    </header>
  );
}

function HeroPreviewCard() {
  return (
    <div className="border border-border bg-card relative rounded-2xl p-4">
      <div className="flex items-center justify-end border-b border-border pb-3">
        <Badge variant="success" className="gap-1.5">
          <LiveDot className="bg-success" />
          Running
        </Badge>
      </div>

      <div className="grid grid-cols-3 gap-2 py-4 sm:gap-3">
        {[
          { label: "Discovered", value: "1,204" },
          { label: "Scraped", value: "958" },
          { label: "Failed", value: "12" },
        ].map((stat) => (
          <div key={stat.label} className="border border-border bg-muted/40 rounded-lg p-2 sm:p-3">
            <p className="text-base font-semibold tabular-nums text-foreground sm:text-lg">{stat.value}</p>
            <p className="text-[11px] text-muted-foreground">{stat.label}</p>
          </div>
        ))}
      </div>

      <div className="border border-border bg-muted/40 space-y-2 rounded-lg p-3 font-mono text-[11px] text-muted-foreground">
        <p>
          <span className="text-success">✓</span> Extracted /blog/scaling-crawlers
        </p>
        <p>
          <span className="text-success">✓</span> Extracted /docs/getting-started
        </p>
        <p className="text-foreground">
          <span className="animate-pulse text-primary">›</span> Crawling /pricing …
        </p>
      </div>
    </div>
  );
}

const AGENT_PROMPTS = [
  "Extract structured data",
  "Map an entire site",
  "Scrape & summarize",
  "Check a crawl",
];

const USER_PROMPT_1 = "Crawl example.com's blog and extract titles + publish dates";
const USER_PROMPT_2 = "How's it going so far?";

const TRACE_STEPS = [
  { icon: ListChecks, iconClassName: "text-violet-500", label: "Updated the plan" },
  { icon: CheckCircle2, iconClassName: "text-success", label: "Crawl started" },
  { icon: CheckCircle2, iconClassName: "text-success", label: "Checked crawl status" },
];

const REPLY_1_WORDS =
  "Started the crawl — I'll pull each post's title and publish date and let you know when it's done."
    .split(" ");

const REPLY_2_WORDS =
  "42 pages discovered, 18 scraped so far — right on track, no errors yet.".split(" ");

// Order of the looping demo. Each stage implies everything before it is also visible.
const STAGE_ORDER = [
  "user",
  "trace-0",
  "trace-1",
  "trace-extracting",
  "trace-2",
  "typing",
  "streaming",
  "user2",
  "trace2-checking",
  "trace2-checked",
  "typing2",
  "streaming2",
  "chips",
] as const;

const WORD_INTERVAL_MS = 90;
const HOLD_MS = 3000;

function TraceLine({ step }: { step: (typeof TRACE_STEPS)[number] }) {
  const Icon = step.icon;
  return (
    <p className="flex items-center gap-1.5">
      <Icon className={`h-3 w-3 ${step.iconClassName}`} />
      {step.label}
    </p>
  );
}

function TypingDots() {
  return (
    <div className="flex items-center gap-1 rounded-2xl rounded-tl-sm bg-muted px-4 py-3">
      {[0, 150, 300].map((delay) => (
        <span
          key={delay}
          className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground/60"
          style={{ animationDelay: `${delay}ms` }}
        />
      ))}
    </div>
  );
}

function useAgentDemo() {
  const containerRef = useRef<HTMLDivElement>(null);
  const inView = useInView(containerRef, { once: false, margin: "-100px" });
  const reducedMotion = useReducedMotion();

  const [stage, setStage] = useState<(typeof STAGE_ORDER)[number]>("user");
  const [word1Count, setWord1Count] = useState(0);
  const [word2Count, setWord2Count] = useState(0);

  useEffect(() => {
    if (reducedMotion) {
      setStage("chips");
      setWord1Count(REPLY_1_WORDS.length);
      setWord2Count(REPLY_2_WORDS.length);
      return;
    }
    if (!inView) return;

    let cancelled = false;
    const timeouts: ReturnType<typeof setTimeout>[] = [];
    const after = (ms: number, fn: () => void) => {
      timeouts.push(setTimeout(() => !cancelled && fn(), ms));
    };

    function runCycle() {
      setStage("user");
      setWord1Count(0);
      setWord2Count(0);

      after(700, () => setStage("trace-0"));
      after(1400, () => setStage("trace-1"));
      after(2100, () => setStage("trace-extracting"));
      after(3100, () => setStage("trace-2"));
      after(3500, () => setStage("typing"));
      after(4100, () => setStage("streaming"));

      REPLY_1_WORDS.forEach((_, i) => {
        after(4100 + i * WORD_INTERVAL_MS, () => setWord1Count(i + 1));
      });

      const streamEnd1 = 4100 + REPLY_1_WORDS.length * WORD_INTERVAL_MS;

      const user2At = streamEnd1 + 900;
      const checking2At = user2At + 600;
      const checked2At = checking2At + 900;
      const typing2At = checked2At + 400;
      const streaming2At = typing2At + 500;

      after(user2At, () => setStage("user2"));
      after(checking2At, () => setStage("trace2-checking"));
      after(checked2At, () => setStage("trace2-checked"));
      after(typing2At, () => setStage("typing2"));
      after(streaming2At, () => setStage("streaming2"));

      REPLY_2_WORDS.forEach((_, i) => {
        after(streaming2At + i * WORD_INTERVAL_MS, () => setWord2Count(i + 1));
      });

      const streamEnd2 = streaming2At + REPLY_2_WORDS.length * WORD_INTERVAL_MS;
      after(streamEnd2 + 300, () => setStage("chips"));
      after(streamEnd2 + 300 + HOLD_MS, runCycle);
    }

    runCycle();

    return () => {
      cancelled = true;
      timeouts.forEach(clearTimeout);
    };
  }, [inView, reducedMotion]);

  const atLeast = (target: (typeof STAGE_ORDER)[number]) =>
    STAGE_ORDER.indexOf(stage) >= STAGE_ORDER.indexOf(target);

  return { containerRef, stage, word1Count, word2Count, atLeast };
}

function AgentShowcase() {
  const { containerRef, stage, word1Count, word2Count, atLeast } = useAgentDemo();

  return (
    <section id="agent" className="border-t border-border/60 bg-muted/30 py-20">
      <div className="mx-auto w-full max-w-7xl px-4 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <Badge variant="outline" className="gap-1.5">
            <Bot className="h-3 w-3" />
            AI agent
          </Badge>
          <h2 className="mt-4 text-3xl font-semibold tracking-tight text-foreground">
            Just tell it what you want
          </h2>
          <p className="mt-3 text-muted-foreground">
            No config forms to fill out. Describe a site and what to pull from it in plain English —
            the agent plans the crawl, runs it, and reports back.
          </p>
        </div>

        {/* App-window mock of the agent chat */}
        <div
          ref={containerRef}
          className="border border-border bg-card mx-auto mt-12 max-w-5xl rounded-2xl p-2 sm:p-3"
        >
          <div className="flex items-center gap-2 px-2 py-2">
            <div className="flex items-center gap-1.5 rounded-md bg-muted/60 px-3 py-1 text-xs text-muted-foreground">
              <Bot className="h-3 w-3" />
              Agent
            </div>
            <Badge variant="success" className="ml-auto gap-1.5">
              <LiveDot className="bg-success" />
              Running
            </Badge>
          </div>

          <div className="min-h-[420px] space-y-4 rounded-xl border border-border/60 bg-background/50 p-3 sm:p-4">
            <AnimatePresence mode="wait">
              {atLeast("user") && (
                <motion.div
                  key={`user-${stage === "user" ? "a" : "b"}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className="flex justify-end"
                >
                  <div className="max-w-md rounded-2xl rounded-tr-sm bg-primary px-4 py-2.5 text-sm text-primary-foreground">
                    {USER_PROMPT_1}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {atLeast("trace-0") && (
              <div className="flex items-start gap-2.5">
                <motion.div
                  initial={{ opacity: 0, scale: 0.7 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.25 }}
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-gradient-copper text-primary-foreground"
                >
                  <Bot className="h-4 w-4" />
                </motion.div>
                <div className="max-w-md flex-1 space-y-2.5">
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className="border border-border bg-muted/40 space-y-1.5 rounded-xl px-3 py-2.5 font-mono text-[11px] text-muted-foreground"
                  >
                    <TraceLine step={TRACE_STEPS[0]} />
                    {atLeast("trace-1") && <TraceLine step={TRACE_STEPS[1]} />}
                    {atLeast("trace-extracting") && !atLeast("trace-2") && (
                      <p className="flex items-center gap-1.5 text-foreground">
                        <Loader2 className="h-3 w-3 animate-spin text-primary" />
                        Checking crawl status …
                      </p>
                    )}
                    {atLeast("trace-2") && <TraceLine step={TRACE_STEPS[2]} />}
                  </motion.div>

                  {stage === "typing" && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.25 }}
                    >
                      <TypingDots />
                    </motion.div>
                  )}

                  {atLeast("streaming") && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.25 }}
                      className="rounded-2xl rounded-tl-sm bg-muted px-4 py-2.5 text-sm text-foreground"
                    >
                      {REPLY_1_WORDS.slice(0, word1Count).join(" ")}
                      {stage === "streaming" && (
                        <span className="ml-0.5 inline-block h-3.5 w-[2px] animate-pulse bg-foreground/60 align-middle" />
                      )}
                    </motion.div>
                  )}
                </div>
              </div>
            )}

            {atLeast("user2") && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="flex justify-end"
              >
                <div className="max-w-md rounded-2xl rounded-tr-sm bg-primary px-4 py-2.5 text-sm text-primary-foreground">
                  {USER_PROMPT_2}
                </div>
              </motion.div>
            )}

            {atLeast("trace2-checking") && (
              <div className="flex items-start gap-2.5">
                <motion.div
                  initial={{ opacity: 0, scale: 0.7 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.25 }}
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-gradient-copper text-primary-foreground"
                >
                  <Bot className="h-4 w-4" />
                </motion.div>
                <div className="max-w-md flex-1 space-y-2.5">
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className="border border-border bg-muted/40 rounded-xl px-3 py-2.5 font-mono text-[11px] text-muted-foreground"
                  >
                    {atLeast("trace2-checked") ? (
                      <TraceLine step={TRACE_STEPS[2]} />
                    ) : (
                      <p className="flex items-center gap-1.5 text-foreground">
                        <Loader2 className="h-3 w-3 animate-spin text-primary" />
                        Checking crawl status …
                      </p>
                    )}
                  </motion.div>

                  {stage === "typing2" && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.25 }}
                    >
                      <TypingDots />
                    </motion.div>
                  )}

                  {atLeast("streaming2") && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.25 }}
                      className="rounded-2xl rounded-tl-sm bg-muted px-4 py-2.5 text-sm text-foreground"
                    >
                      {REPLY_2_WORDS.slice(0, word2Count).join(" ")}
                      {stage === "streaming2" && (
                        <span className="ml-0.5 inline-block h-3.5 w-[2px] animate-pulse bg-foreground/60 align-middle" />
                      )}
                    </motion.div>
                  )}
                </div>
              </div>
            )}

            {atLeast("chips") && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
                className="flex flex-wrap gap-2 pt-1"
              >
                {AGENT_PROMPTS.map((prompt) => (
                  <span
                    key={prompt}
                    className="border border-border bg-card rounded-full px-3 py-1 text-xs text-muted-foreground"
                  >
                    {prompt}
                  </span>
                ))}
              </motion.div>
            )}
          </div>
        </div>

        <div className="mt-8 flex justify-center">
          <Button asChild size="lg">
            <Link to="/signup">
              Try the agent
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}

// Deterministic sample data for the marketing dashboard mock (no live backend
// on the public page). A gentle wave that trends up so the throughput graph
// reads as a real, accelerating crawl.
const THROUGHPUT = Array.from({ length: 32 }, (_, i) => ({
  t: i,
  v: Math.max(
    0.5,
    +(2.4 + Math.sin(i / 3.1) * 1.1 + Math.sin(i / 1.6) * 0.45 + i * 0.04).toFixed(2),
  ),
}));

const STATUS_SLICES = [
  { label: "Completed", value: 958, color: "hsl(var(--success))" },
  { label: "Running", value: 234, color: "hsl(var(--primary))" },
  { label: "Failed", value: 12, color: "hsl(var(--destructive))" },
];

const SHOWCASE_STATS = [
  { icon: Compass, label: "Discovered", value: "1,204" },
  { icon: FileJson, label: "Scraped", value: "958" },
  { icon: Gauge, label: "Throughput", value: "3.2/s" },
  { icon: CheckCircle2, label: "Success rate", value: "98.8%" },
];

function LiveDashboardShowcase() {
  const total = STATUS_SLICES.reduce((sum, s) => sum + s.value, 0);

  return (
    <section className="border-t border-border/60 py-20">
      <div className="mx-auto w-full max-w-7xl px-4 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <Badge variant="outline" className="gap-1.5">
            <Activity className="h-3 w-3" />
            Real-time dashboard
          </Badge>
          <h2 className="mt-4 text-3xl font-semibold tracking-tight text-foreground">
            Watch every crawl as it happens
          </h2>
          <p className="mt-3 text-muted-foreground">
            Live throughput, progress, and per-status breakdowns stream in while your crawl runs —
            no refreshing, no guesswork.
          </p>
        </div>

        {/* App-window mock of the live dashboard */}
        <div className="border border-border bg-card mx-auto mt-12 max-w-5xl rounded-2xl p-2 sm:p-3">
          {/* Window chrome */}
          <div className="flex items-center gap-2 px-2 py-2">
            <div className="flex items-center gap-1.5 rounded-md bg-muted/60 px-3 py-1 text-xs text-muted-foreground">
              <Radar className="h-3 w-3" />
              Dashboard
            </div>
            <Badge variant="success" className="ml-auto gap-1.5">
              <LiveDot className="bg-success" />
              Running
            </Badge>
          </div>

          {/* Recessed app canvas holding the white cards */}
          <div className="space-y-4 rounded-xl border border-border/60 bg-background/50 p-3 sm:p-4">
            {/* Stat tiles */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {SHOWCASE_STATS.map(({ icon: Icon, label, value }) => (
                <div key={label} className="border border-border bg-card rounded-lg p-3">
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <Icon className="h-3.5 w-3.5" />
                    <span className="text-[10px] font-medium uppercase tracking-wide">{label}</span>
                  </div>
                  <p className="mt-1 text-xl font-semibold tabular-nums text-foreground">{value}</p>
                </div>
              ))}
            </div>

            {/* Throughput graph + status donut */}
            <div className="grid gap-4 lg:grid-cols-3">
              <div className="border border-border bg-card rounded-xl p-4 lg:col-span-2">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-foreground">Crawl throughput</p>
                    <p className="text-xs text-muted-foreground">Pages extracted per second</p>
                  </div>
                  <span className="text-sm font-semibold tabular-nums text-primary">3.2 /s</span>
                </div>
                <div className="mt-3 h-40 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={THROUGHPUT} margin={{ top: 6, right: 6, bottom: 0, left: 6 }}>
                      <defs>
                        <linearGradient id="lp-throughput" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.35} />
                          <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid vertical={false} stroke="hsl(var(--border))" strokeOpacity={0.6} />
                      <Area
                        type="monotone"
                        dataKey="v"
                        stroke="hsl(var(--primary))"
                        strokeWidth={2}
                        fill="url(#lp-throughput)"
                        isAnimationActive={false}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="border border-border bg-card rounded-xl p-4">
                <p className="text-sm font-semibold text-foreground">Status</p>
                <p className="text-xs text-muted-foreground">Pages by outcome</p>
                <div className="relative mx-auto mt-2 h-32 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={STATUS_SLICES}
                        dataKey="value"
                        nameKey="label"
                        innerRadius="62%"
                        outerRadius="90%"
                        paddingAngle={2}
                        stroke="hsl(var(--card))"
                        strokeWidth={2}
                        isAnimationActive={false}
                      >
                        {STATUS_SLICES.map((s) => (
                          <Cell key={s.label} fill={s.color} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                    <p className="text-lg font-semibold tabular-nums text-foreground">
                      {total.toLocaleString()}
                    </p>
                    <p className="text-[10px] text-muted-foreground">Total</p>
                  </div>
                </div>
                <div className="mt-2 space-y-1">
                  {STATUS_SLICES.map((s) => (
                    <div key={s.label} className="flex items-center gap-1.5 text-xs">
                      <span
                        className="h-2 w-2 shrink-0 rounded-full"
                        style={{ backgroundColor: s.color }}
                      />
                      <span className="text-muted-foreground">{s.label}</span>
                      <span className="ml-auto font-medium tabular-nums text-foreground">
                        {s.value.toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Progress */}
            <div className="border border-border bg-card rounded-xl p-4">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium text-foreground">Crawling acme.com</span>
                <span className="tabular-nums text-muted-foreground">958 of 1,204 pages</span>
              </div>
              <Progress value={79} className="mt-2.5" />
            </div>

            {/* Live log */}
            <div className="border border-border bg-muted/40 space-y-1.5 rounded-xl p-4 font-mono text-[11px] leading-relaxed text-muted-foreground">
              <p>
                <span className="text-success">✓</span> Extracted /blog/scaling-crawlers
                <span className="text-muted-foreground/50"> · 1.2s</span>
              </p>
              <p>
                <span className="text-success">✓</span> Extracted /docs/getting-started
                <span className="text-muted-foreground/50"> · 0.9s</span>
              </p>
              <p>
                <span className="text-success">✓</span> Extracted /customers/acme
                <span className="text-muted-foreground/50"> · 1.4s</span>
              </p>
              <p className="text-foreground">
                <span className="animate-pulse text-primary">›</span> Crawling /pricing …
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default function LandingPage() {
  return (
    <div className="min-h-dvh bg-background">
      <PublicNav />

      <section className="relative overflow-hidden">
        <div
          className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[560px]"
          style={{
            backgroundImage:
              "radial-gradient(circle at 15% 10%, hsl(var(--primary) / 0.14), transparent 45%), radial-gradient(circle at 85% 25%, hsl(var(--primary) / 0.1), transparent 40%)",
          }}
        />

        <div className="mx-auto grid w-full max-w-7xl gap-12 px-4 py-16 lg:grid-cols-2 lg:items-center lg:px-8 lg:py-24">
          <div>
            <Badge variant="outline" className="gap-1.5">
              <Bot className="h-3 w-3" />
              New: an AI agent that crawls for you
            </Badge>

            <h1 className="mt-5 text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
              Turn any website into <span className="text-gradient">structured data</span>
            </h1>

            <p className="mt-5 max-w-lg text-base leading-relaxed text-muted-foreground sm:text-lg">
              Describe what you need in plain English and let the agent plan and run the crawl, or
              configure it yourself — heuristics or an LLM, Markdown, JSON, or XML, proxy rotation and
              human-like behavior built in.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Button asChild size="lg">
                <Link to="/signup">
                  Get started free
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link to="/login">Log in</Link>
              </Button>
            </div>

            <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
              {["No credit card required", "Self-hostable", "Open configuration"].map((item) => (
                <span key={item} className="flex items-center gap-1.5">
                  <Check className="h-3.5 w-3.5 text-success" />
                  {item}
                </span>
              ))}
            </div>
          </div>

          <HeroPreviewCard />
        </div>
      </section>

      <AgentShowcase />

      <LiveDashboardShowcase />

      <section id="features" className="border-t border-border bg-muted/30 py-20">
        <div className="mx-auto w-full max-w-7xl px-4 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-semibold tracking-tight text-foreground">
              Everything you need to crawl at scale
            </h2>
            <p className="mt-3 text-muted-foreground">
              One crawler, configured for the job — from a quick scrape to a full site extraction pipeline.
            </p>
          </div>

          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map(({ icon: Icon, title, description }) => (
              <div key={title} className="border border-border bg-card rounded-xl p-5">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-copper-soft text-primary">
                  <Icon className="h-4.5 w-4.5" />
                </div>
                <h3 className="mt-4 text-sm font-semibold text-foreground">{title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="how-it-works" className="py-20">
        <div className="mx-auto w-full max-w-7xl px-4 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-semibold tracking-tight text-foreground">Three steps to structured data</h2>
            <p className="mt-3 text-muted-foreground">No pipelines to wire up. No scripts to babysit.</p>
          </div>

          <div className="mt-12 grid gap-8 sm:grid-cols-3">
            {STEPS.map(({ step, title, description }) => (
              <div key={step} className="relative">
                <span className="text-sm font-semibold text-primary/60">{step}</span>
                <h3 className="mt-2 text-base font-semibold text-foreground">{title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-border py-20">
        <div className="mx-auto w-full max-w-7xl px-4 lg:px-8">
          <div className="border border-border bg-card flex flex-col items-center gap-6 rounded-2xl px-6 py-14 text-center">
            <Zap className="h-8 w-8 text-primary" />
            <h2 className="max-w-xl text-3xl font-semibold tracking-tight text-foreground">
              Ready to start crawling smarter?
            </h2>
            <p className="max-w-md text-muted-foreground">
              Create a free account and launch your first crawl in minutes.
            </p>
            <Button asChild size="lg">
              <Link to="/signup">
                Get started free
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <footer className="border-t border-border py-10">
        <div className="mx-auto flex w-full max-w-7xl flex-col items-center justify-between gap-4 px-4 text-sm text-muted-foreground sm:flex-row lg:px-8">
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-md bg-gradient-copper text-primary-foreground">
              <Radar className="h-3.5 w-3.5" />
            </div>
            <span className="font-medium text-foreground">OneCrawler</span>
          </div>
          <p>© {new Date().getFullYear()} OneCrawler. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
