import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { Radar, ShieldCheck, Sparkles, Zap } from "lucide-react";

const HIGHLIGHTS = [
  { icon: Zap, text: "Deep or shallow link extraction, sitemap discovery, or full crawler mode" },
  { icon: Sparkles, text: "Heuristic or GenAI-powered extraction with structured output schemas" },
  { icon: ShieldCheck, text: "Proxy rotation and human-like behavior to crawl reliably at scale" },
];

export function AuthLayout({
  title,
  description,
  children,
  footer,
}: {
  title: string;
  description: string;
  children: ReactNode;
  footer: ReactNode;
}) {
  return (
    <div className="grid min-h-dvh lg:grid-cols-2">
      {/* Fixed deep near-black brand panel — pinned dark in BOTH themes (not the
          theme's --foreground, which flips to near-white in dark mode). */}
      <div className="relative hidden flex-col justify-between overflow-hidden bg-[#0b0e18] p-10 text-white lg:flex">
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage:
              "radial-gradient(circle at 22% 16%, hsl(var(--primary) / 0.55), transparent 42%), radial-gradient(circle at 92% 88%, hsl(var(--primary) / 0.32), transparent 46%)",
          }}
        />
        {/* On-brand radar rings emanating from the sweep point — fills the panel
            with intentional motion instead of dead space. */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage:
              "repeating-radial-gradient(circle at 82% 40%, transparent 0 78px, hsl(0 0% 100% / 0.045) 78px 79px)",
          }}
        />

        <Link to="/" className="relative z-10 flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-copper text-primary-foreground">
            <Radar className="h-4 w-4" />
          </div>
          <span className="text-sm font-semibold tracking-tight">OneCrawler</span>
        </Link>

        <div className="relative z-10 space-y-8">
          <blockquote className="space-y-3">
            <p className="text-2xl font-medium leading-snug">
              Turn any site into structured data — without babysitting a crawler.
            </p>
          </blockquote>

          <ul className="space-y-4">
            {HIGHLIGHTS.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-start gap-3 text-sm text-white/85">
                <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white/10 text-white ring-1 ring-inset ring-white/15">
                  <Icon className="h-3.5 w-3.5" />
                </span>
                {text}
              </li>
            ))}
          </ul>
        </div>

        <p className="relative z-10 text-xs text-white/55">© {new Date().getFullYear()} OneCrawler</p>
      </div>

      <div className="relative flex flex-col justify-center overflow-hidden bg-background px-6 py-12 sm:px-12 lg:px-16">
        {/* One intentional, soft glow instead of the global blobs bleeding
            through as an uneven diagonal wash. */}
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-72"
          style={{
            backgroundImage:
              "radial-gradient(ellipse 70% 100% at 50% 0%, hsl(var(--primary) / 0.08), transparent)",
          }}
        />
        <div className="relative mx-auto w-full max-w-sm">
          <Link to="/" className="mb-8 flex items-center gap-2 lg:hidden">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-copper text-primary-foreground">
              <Radar className="h-4 w-4" />
            </div>
            <span className="text-sm font-semibold tracking-tight text-foreground">OneCrawler</span>
          </Link>

          <h1 className="text-2xl font-semibold tracking-tight text-foreground">{title}</h1>
          <p className="mt-1.5 text-sm text-muted-foreground">{description}</p>

          <div className="mt-8">{children}</div>

          <div className="mt-6 text-center text-sm text-muted-foreground">{footer}</div>
        </div>
      </div>
    </div>
  );
}
