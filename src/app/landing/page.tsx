import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Sparkles, Github, ExternalLink } from "lucide-react";

export const metadata = {
  title: "Sonar — sourcing engine for pre-VC AI-native founders",
  description: "Scans HN, GitHub, and Hugging Face. Scores founders against Quanta's 9 culture principles. Built as the application deliverable for a venture analyst role.",
};

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="max-w-5xl mx-auto px-6 py-16 space-y-24">

        <section className="space-y-6 max-w-3xl">
          <p className="text-xs tracking-widest uppercase text-muted-foreground">
            For Evan · 2026-05-13
          </p>
          <h1 className="text-5xl font-semibold tracking-tight leading-[1.05]">
            I built a sourcing engine for myself. <span className="text-primary">Here it is pointed at Quanta.</span>
          </h1>
          <p className="text-lg text-muted-foreground leading-relaxed">
            Sonar scans where AI-native founders show up <em>before</em> they fundraise — Hacker News, GitHub, Hugging Face — and scores every team against Quanta&apos;s 9 culture principles with citable evidence.
          </p>
          <div className="flex gap-3 pt-2">
            <Button asChild size="lg">
              <Link href="/companies">
                Open the kanban
                <ExternalLink className="size-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/scan">
                <Sparkles className="size-4" />
                Try the scan layer
              </Link>
            </Button>
          </div>
        </section>

        <section className="space-y-4 max-w-2xl">
          <h2 className="text-2xl font-semibold tracking-tight">What it does, in one paragraph</h2>
          <p className="text-base text-muted-foreground leading-relaxed">
            Paste a URL or hit <em>scan</em>. Sonar runs four parallel web-search queries — company overview, momentum signal, founder content, founder pedigree — then synthesizes a 9-principle scorecard. Strong / weak / unknown per principle, with citations. Composite fitScore 0–100. About 30 seconds per founder.
          </p>
        </section>

        <section className="space-y-6">
          <h2 className="text-2xl font-semibold tracking-tight">Three deliberate omissions</h2>
          <div className="grid gap-4 md:grid-cols-3">
            <Omission
              title="No outreach drafting"
              body="Founder DMs from a stranger in a voice that isn't yours are a demo risk, not an asset. The drafting layer lives in Sonar's ancestor project (a job-hunt CRM). It's not here."
            />
            <Omission
              title="No paid sourcing APIs"
              body="Crunchbase is $249/mo and lags real signal. Twitter API is $5K+/yr. LinkedIn is ToS gray. HN + GitHub + HF cover ~80% of pre-launch AI-native founders for $0."
            />
            <Omission
              title="No YC scan"
              body="YC companies are already capitalized — $500K + advisory. Lagging indicator. We want founders before a venture firm has touched them."
            />
          </div>
        </section>

        <section className="space-y-4 max-w-2xl">
          <h2 className="text-2xl font-semibold tracking-tight">The 9 principles</h2>
          <p className="text-base text-muted-foreground leading-relaxed">
            Pulled verbatim from Quanta&apos;s culture page. Each one operationalized into a scoring rubric the model reads at evaluation time. Edit the rubric in <Link href="/settings" className="underline hover:text-foreground">Thesis</Link>; new scores reflect the change.
          </p>
          <ul className="grid gap-2 sm:grid-cols-3 text-sm">
            {[
              "Kaizen",
              "Truth-seeking",
              "Customer Obsession",
              "Initiative",
              "Prioritization",
              "Insanely High Standards",
              "Extreme Ownership",
              "Think Big and Long",
              "Integrity",
            ].map((p) => (
              <li key={p} className="rounded-md border border-border bg-card px-3 py-2">
                {p}
              </li>
            ))}
          </ul>
        </section>

        <section className="space-y-4 max-w-2xl">
          <h2 className="text-2xl font-semibold tracking-tight">Lineage</h2>
          <p className="text-base text-muted-foreground leading-relaxed">
            Forked from Narad, a job-hunt pipeline I built for myself, at the commit before its
            SQLite redesign. Narad scanned where engineering jobs got posted, researched companies,
            scored fit against my CV, and drafted outreach. Sonar keeps the research and scoring
            layers, retunes the prompts for VC sourcing, drops outreach entirely. Same engine,
            different aperture.
          </p>
          <Button asChild variant="outline" size="sm">
            <a href="https://github.com/mohitmujawdiya/sonar" target="_blank" rel="noopener">
              <Github className="size-4" />
              View on GitHub
            </a>
          </Button>
        </section>

        <footer className="pt-12 border-t border-border text-xs text-muted-foreground space-y-1">
          <p>Built in 12 hours as the application deliverable for a venture analyst role at Quanta.</p>
          <p>If you&apos;re reading this and we haven&apos;t talked yet — <a href="mailto:mohit@example.com" className="underline hover:text-foreground">let&apos;s talk</a>.</p>
        </footer>
      </div>
    </main>
  );
}

function Omission({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-md border border-border bg-card p-4 space-y-2">
      <h3 className="font-medium text-sm">{title}</h3>
      <p className="text-sm text-muted-foreground leading-relaxed">{body}</p>
    </div>
  );
}
