import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  Bot,
  BookOpen,
  Compass,
  Database,
  Download,
  FileCode,
  FileDown,
  Filter,
  HelpCircle,
  Layers,
  Lightbulb,
  ListTree,
  Map,
  Radar,
  Rocket,
  ScanSearch,
  Sparkles,
  SquarePlus,
  Waypoints,
} from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Accordion, type AccordionItemData } from "@/components/tutorial/accordion";
import { cn } from "@/lib/utils";
import { useSettingsDialogStore } from "@/store/settings-dialog-store";

// ── Content ────────────────────────────────────────────────────────────────

const TOC = [
  { id: "overview", label: "Overview" },
  { id: "pipeline", label: "How it works" },
  { id: "concepts", label: "Core concepts" },
  { id: "first-crawl", label: "Your first crawl" },
  { id: "tips", label: "Tips & best practices" },
  { id: "faq", label: "FAQ" },
  { id: "glossary", label: "Glossary" },
];

const PIPELINE = [
  { icon: Compass, title: "Discover", body: "Find the URLs worth visiting — from a sitemap, by following links, or by crawling." },
  { icon: Filter, title: "Filter", body: "Keep only the pages you care about — by date, keywords, file type, or similarity." },
  { icon: ScanSearch, title: "Scrape", body: "Extract content from each page — fast heuristics, GenAI fields, or clean Markdown." },
  { icon: Download, title: "Export", body: "Download the results as Markdown, JSON, XML, or TEI — one file or in bulk." },
];

const DISCOVERY_MODES = [
  {
    icon: Map,
    name: "Sitemap discovery",
    tag: "Start here",
    body: "Reads the site's sitemap.xml to enumerate URLs instantly. It's the cheapest and fastest option — no browser, no guessing. Reach for this first on any well-maintained site.",
  },
  {
    icon: Waypoints,
    name: "Link extraction",
    tag: "JS-heavy sites",
    body: "Loads pages in a real browser and follows their links. Use it when a site has no sitemap, or renders its navigation with JavaScript that a plain fetch would miss.",
  },
  {
    icon: Radar,
    name: "Full crawler",
    tag: "Most thorough",
    body: "Recursively walks the site from a starting URL, discovering and scraping as it goes. The most complete coverage — and the most time and resources. Bound it with a URL limit and filters.",
  },
  {
    icon: FileDown,
    name: "Direct scraper",
    tag: "You have the URLs",
    body: "Skips discovery entirely and scrapes a specific list of URLs you already have. Perfect when you know exactly which pages you want.",
  },
];

const STRATEGIES = [
  {
    icon: ScanSearch,
    name: "Heuristic",
    tag: "Default · no key",
    body: "Fast, deterministic content extraction with no AI and no API cost. Great for articles, blogs, and news. This is the default — start here.",
  },
  {
    icon: Sparkles,
    name: "GenAI extraction",
    tag: "Typed fields",
    body: "Uses an LLM to pull typed, schema-shaped fields (title, price, author…) from unstructured pages. Define the fields in the schema builder. Needs a provider API key set in Settings.",
  },
  {
    icon: FileCode,
    name: "Markdownify",
    tag: "Verbatim",
    body: "Converts the full page HTML into clean Markdown, preserving structure. Ideal for documentation and long-form content you want to keep as-is.",
  },
];

const FILTERS = [
  { name: "By date", body: "Keep only pages published within a date range." },
  { name: "By keywords", body: "Keep pages whose content contains the keywords you list." },
  { name: "By files", body: "Keep links pointing to specific file types (PDF, DOCX, …)." },
  { name: "By extension", body: "Include or exclude URLs based on their extension." },
  { name: "By cosine similarity", body: "Keep pages semantically close to a reference text you provide." },
];

const FIRST_CRAWL = [
  { title: "Open New Crawl", body: "From the top navigation, or the New Crawl button on the dashboard." },
  { title: "Enter a target URL", body: "Paste the site or page you want data from, e.g. https://example.com." },
  { title: "Pick a discovery mode", body: "Start with Sitemap discovery. If the site has no sitemap, switch to Link extraction." },
  {
    title: "Choose a scraping strategy",
    body: "Heuristic is the default and needs no key. Choose GenAI for typed fields (add a schema and an API key in Settings first).",
  },
  {
    title: "Refine it (optional)",
    body: "Add URL filters, set concurrency, or enable proxy rotation to stay under rate limits. Save the setup as a template to reuse later.",
  },
  {
    title: "Launch and watch it run",
    body: "Follow live throughput, discovered URLs, and the log on the crawl detail page as pages are extracted.",
  },
  {
    title: "Export your dataset",
    body: "Open the Extracted Data tab, filter to what you need, and export to Markdown, JSON, XML, or TEI — individually or in bulk.",
  },
];

const TIPS = [
  "Prefer sitemap discovery first — it's the cheapest way to enumerate a site's URLs.",
  "Use URL filters to skip pagination, tag pages, and other low-value routes.",
  "Enable proxy rotation on large crawls to avoid rate limits and blocks.",
  "Save configurations you reuse as templates to launch new crawls faster.",
  "Heuristic extraction is fast — switch to GenAI only when you need structured fields.",
  "Lower concurrency and enable human behavior if a site starts blocking you.",
  "Watch the dashboard success rate to catch sites that need tuning.",
  "Let the AI agent plan a crawl for you when you're not sure how to configure one.",
];

const FAQ: AccordionItemData[] = [
  {
    q: "Do I need an API key to use OneCrawler?",
    a: (
      <>
        Only for AI features. Heuristic and Markdownify extraction need no key at all. GenAI extraction
        and the AI agent each need a provider key, which you add under{" "}
        <button
          type="button"
          onClick={() => useSettingsDialogStore.getState().openSettings()}
          className="text-primary underline-offset-4 hover:underline"
        >
          Settings
        </button>
        .
      </>
    ),
  },
  {
    q: "How do I get structured JSON fields instead of plain text?",
    a: "Choose the GenAI scraping strategy and define your fields in the schema builder (name, type, optional). Each scraped page comes back shaped to that schema.",
  },
  {
    q: "Why were some pages skipped or missing from my results?",
    a: "Usually a filter excluded them, the site blocked the request, or extraction failed for that page. The live log on the crawl detail page shows exactly what happened for each URL.",
  },
  {
    q: "How do I avoid getting rate-limited or blocked?",
    a: "Enable proxy rotation, lower the concurrency, and turn on human-behavior settings (randomized delays, scrolling, mouse movement) so requests look less robotic.",
  },
  {
    q: "Can the AI agent run crawls for me?",
    a: (
      <>
        Yes. Configure it once in Settings, then just describe what you want in the{" "}
        <Link to="/dashboard/agents" className="text-primary hover:underline">
          Agent
        </Link>{" "}
        tab — it plans the crawl, launches it, and reports back.
      </>
    ),
  },
  {
    q: "What's a template?",
    a: "A saved snapshot of crawl settings — discovery mode, strategy, filters, proxies, and more — that you can apply to a new crawl in one click instead of reconfiguring each time.",
  },
];

const GLOSSARY = [
  { term: "Crawl (job)", def: "One run of OneCrawler against a target — from discovery through export." },
  { term: "Discovery", def: "The stage that collects the list of URLs to scrape (sitemap, links, or crawl)." },
  { term: "Scraping strategy", def: "How content is extracted from each page: heuristic, GenAI, or markdownify." },
  { term: "GenAI schema", def: "The typed field definitions the LLM fills in when using GenAI extraction." },
  { term: "Filter chain", def: "One or more filters combined with AND/OR to decide which URLs to keep." },
  { term: "Concurrency", def: "How many pages are fetched at once — higher is faster but more likely to get blocked." },
  { term: "Proxy rotation", def: "Cycling requests through multiple proxies to spread load and avoid blocks." },
  { term: "Throughput", def: "Pages processed per second, shown live on the crawl detail page." },
];

// ── Scroll-spy ───────────────────────────────────────────────────────────────

// Highlights the table-of-contents entry for whichever section is currently
// near the top of the viewport. Observes against the viewport (root: null) —
// the app's scroll container fills it, so entries fire as the user scrolls.
function useActiveSection(ids: string[]) {
  const [active, setActive] = useState(ids[0]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActive(visible[0].target.id);
      },
      // Bias the "active" band to the top quarter of the screen so a section
      // lights up as its heading reaches the top, not when it's centered.
      { rootMargin: "-72px 0px -70% 0px", threshold: 0 },
    );

    for (const id of ids) {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    }
    return () => observer.disconnect();
  }, [ids]);

  return active;
}

// ── Building blocks ──────────────────────────────────────────────────────────

function Section({ id, icon: Icon, title, children }: { id: string; icon: typeof Rocket; title: string; children: React.ReactNode }) {
  return (
    <section id={id} className="scroll-mt-20">
      <div className="mb-4 flex items-center gap-2.5">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-copper-soft text-primary ring-1 ring-primary/20">
          <Icon className="h-4 w-4" />
        </div>
        <h2 className="text-lg font-semibold tracking-tight text-foreground">{title}</h2>
      </div>
      {children}
    </section>
  );
}

function ConceptCard({ icon: Icon, name, tag, body }: { icon: typeof Rocket; name: string; tag: string; body: string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-center justify-between gap-2">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-copper-soft text-primary ring-1 ring-primary/20">
          <Icon className="h-4 w-4" />
        </div>
        <span className="rounded-md bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">{tag}</span>
      </div>
      <p className="mt-3 text-sm font-semibold text-foreground">{name}</p>
      <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{body}</p>
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function TutorialPage() {
  const tocIds = useRef(TOC.map((t) => t.id)).current;
  const active = useActiveSection(tocIds);

  return (
    <div className="space-y-6">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-xl border border-border bg-card p-6">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full bg-[radial-gradient(circle,hsl(var(--primary)/0.18),hsl(var(--gradient-to)/0.10)_55%,transparent_75%)]"
        />
        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-copper-soft text-primary ring-1 ring-primary/20">
              <Rocket className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-foreground">
                Getting started with <span className="text-gradient">OneCrawler</span>
              </h1>
              <p className="mt-1.5 max-w-2xl text-sm text-muted-foreground">
                Turn any website into clean, structured data — no scraping code required. This guide
                walks you from your very first crawl through every core concept.
              </p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <Button asChild variant="outline">
              <Link to="/dashboard/agents">
                <Bot className="h-4 w-4" />
                Ask the agent
              </Link>
            </Button>
            <Button asChild>
              <Link to="/dashboard/crawls/new">
                <SquarePlus className="h-4 w-4" />
                New Crawl
              </Link>
            </Button>
          </div>
        </div>
      </div>

      <div className="lg:grid lg:grid-cols-[196px_1fr] lg:gap-8">
        {/* Table of contents (desktop) */}
        <aside className="hidden lg:block">
          <nav className="sticky top-4 space-y-1">
            <p className="px-3 pb-1 text-[11px] font-medium uppercase tracking-wider text-muted-foreground/70">
              On this page
            </p>
            {TOC.map((t) => (
              <a
                key={t.id}
                href={`#${t.id}`}
                className={cn(
                  "block rounded-lg px-3 py-1.5 text-sm transition-colors duration-150",
                  active === t.id
                    ? "bg-accent font-medium text-foreground"
                    : "text-muted-foreground hover:bg-accent/50 hover:text-foreground",
                )}
              >
                {t.label}
              </a>
            ))}
          </nav>
        </aside>

        {/* Content */}
        <div className="min-w-0 space-y-10">
          <Section id="overview" icon={BookOpen} title="Overview">
            <Card>
              <CardContent className="p-5 text-sm leading-relaxed text-muted-foreground">
                <p>
                  <span className="font-medium text-foreground">OneCrawler</span> takes a website and
                  hands you an exportable dataset. You point it at a URL; it discovers the pages worth
                  visiting, scrapes their content, and gives you clean results in the format you choose.
                </p>
                <p className="mt-3">
                  Every crawl follows the same four stages below. You can drive it yourself from the{" "}
                  <Link to="/dashboard/crawls/new" className="text-primary hover:underline">
                    New Crawl
                  </Link>{" "}
                  form, or let the built-in AI agent plan and launch one for you.
                </p>
              </CardContent>
            </Card>
          </Section>

          <Section id="pipeline" icon={ListTree} title="How it works">
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {PIPELINE.map((stage, i) => (
                <div key={stage.title} className="relative rounded-xl border border-border bg-card p-4">
                  <div className="flex items-center gap-2">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-copper-soft text-primary ring-1 ring-primary/20">
                      <stage.icon className="h-4 w-4" />
                    </div>
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">
                      Step {i + 1}
                    </span>
                  </div>
                  <p className="mt-3 text-sm font-semibold text-foreground">{stage.title}</p>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{stage.body}</p>
                </div>
              ))}
            </div>
          </Section>

          <Section id="concepts" icon={Compass} title="Core concepts">
            <div className="space-y-6">
              <div>
                <h3 className="mb-3 text-sm font-semibold text-foreground">Discovery modes</h3>
                <div className="grid gap-3 sm:grid-cols-2">
                  {DISCOVERY_MODES.map((m) => (
                    <ConceptCard key={m.name} {...m} />
                  ))}
                </div>
              </div>

              <div>
                <h3 className="mb-3 text-sm font-semibold text-foreground">Scraping strategies</h3>
                <div className="grid gap-3 sm:grid-cols-3">
                  {STRATEGIES.map((s) => (
                    <ConceptCard key={s.name} {...s} />
                  ))}
                </div>
              </div>

              <div>
                <h3 className="mb-1 text-sm font-semibold text-foreground">Content filters</h3>
                <p className="mb-3 text-xs text-muted-foreground">
                  Combine any of these with <span className="font-medium text-foreground">AND</span> (all
                  must pass) or <span className="font-medium text-foreground">OR</span> (any passes) to
                  decide which discovered URLs get scraped.
                </p>
                <Card>
                  <CardContent className="divide-y divide-border p-0">
                    {FILTERS.map((f) => (
                      <div key={f.name} className="flex items-start gap-3 px-4 py-3">
                        <Filter className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                        <div>
                          <p className="text-sm font-medium text-foreground">{f.name}</p>
                          <p className="text-xs text-muted-foreground">{f.body}</p>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>
            </div>
          </Section>

          <Section id="first-crawl" icon={Rocket} title="Your first crawl">
            <Card>
              <CardContent className="space-y-5 p-5">
                {FIRST_CRAWL.map((step, i) => (
                  <div key={step.title} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-copper text-xs font-semibold text-primary-foreground">
                        {i + 1}
                      </div>
                      {i < FIRST_CRAWL.length - 1 && <div className="mt-1 h-full w-px flex-1 bg-border" />}
                    </div>
                    <div className="pb-1">
                      <p className="text-sm font-medium text-foreground">{step.title}</p>
                      <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{step.body}</p>
                    </div>
                  </div>
                ))}
                <div className="pt-1">
                  <Button asChild size="sm">
                    <Link to="/dashboard/crawls/new">
                      Start your first crawl
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </Section>

          <Section id="tips" icon={Lightbulb} title="Tips & best practices">
            <Card>
              <CardContent className="p-5">
                <ul className="grid gap-3 sm:grid-cols-2">
                  {TIPS.map((tip) => (
                    <li key={tip} className="flex gap-2.5 text-sm text-muted-foreground">
                      <Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-warning" />
                      <span>{tip}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </Section>

          <Section id="faq" icon={HelpCircle} title="FAQ">
            <Accordion items={FAQ} />
          </Section>

          <Section id="glossary" icon={BookOpen} title="Glossary">
            <Card>
              <CardContent className="grid gap-x-6 gap-y-4 p-5 sm:grid-cols-2">
                {GLOSSARY.map((g) => (
                  <div key={g.term}>
                    <p className="text-sm font-medium text-foreground">{g.term}</p>
                    <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{g.def}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          </Section>

          {/* Next steps */}
          <div className="grid gap-3 sm:grid-cols-3">
            {[
              { to: "/dashboard/crawls/new", icon: SquarePlus, label: "New Crawl", hint: "Launch one now" },
              { to: "/dashboard/templates", icon: Layers, label: "Templates", hint: "Save & reuse setups" },
              { to: "/dashboard/data", icon: Database, label: "Extracted Data", hint: "Browse & export" },
            ].map((c) => (
              <Link
                key={c.to}
                to={c.to}
                className="group flex items-center gap-3 rounded-xl border border-border bg-card p-4 transition-colors duration-150 hover:border-primary/40 hover:bg-accent"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-copper-soft text-primary ring-1 ring-primary/20">
                  <c.icon className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-foreground">{c.label}</p>
                  <p className="truncate text-xs text-muted-foreground">{c.hint}</p>
                </div>
                <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
