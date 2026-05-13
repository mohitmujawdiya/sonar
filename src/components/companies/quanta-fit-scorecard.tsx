"use client";

import { cn } from "@/lib/utils";
import { CheckCircle2, MinusCircle, HelpCircle } from "lucide-react";

type Signal = "strong" | "weak" | "unknown";

type Principle = {
  name: string;
  signal: Signal;
  evidence: string;
  reasoning: string;
};

export type QuantaFit = {
  compositeScore: number;
  compositeReasoning: string;
  principles: Principle[];
};

const SIGNAL_COPY: Record<Signal, string> = {
  strong: "Strong",
  weak: "Weak",
  unknown: "Unknown",
};

const SIGNAL_ICON: Record<Signal, typeof CheckCircle2> = {
  strong: CheckCircle2,
  weak: MinusCircle,
  unknown: HelpCircle,
};

function SignalBadge({ signal }: { signal: Signal }) {
  const Icon = SIGNAL_ICON[signal];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide",
        signal === "strong" && "bg-primary/15 text-primary",
        signal === "weak" && "bg-muted text-muted-foreground",
        signal === "unknown" && "bg-muted/40 text-muted-foreground/70",
      )}
    >
      <Icon className="size-3" />
      {SIGNAL_COPY[signal]}
    </span>
  );
}

function ScoreRing({ score }: { score: number }) {
  // SVG ring chart, 60px square, stroke proportional to score.
  const radius = 26;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="relative size-16 shrink-0">
      <svg viewBox="0 0 60 60" className="size-16 -rotate-90">
        <circle
          cx="30"
          cy="30"
          r={radius}
          fill="none"
          strokeWidth="6"
          className="stroke-muted"
        />
        <circle
          cx="30"
          cy="30"
          r={radius}
          fill="none"
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="stroke-primary transition-all duration-700 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center text-base font-semibold tabular-nums">
        {score}
      </div>
    </div>
  );
}

function PrincipleCard({ principle }: { principle: Principle }) {
  return (
    <div
      className={cn(
        "rounded-md border bg-card p-3 space-y-2 transition-colors",
        principle.signal === "strong" && "border-primary/40",
        principle.signal === "weak" && "border-border",
        principle.signal === "unknown" && "border-border/60 opacity-80",
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <h4 className="font-medium text-sm">{principle.name}</h4>
        <SignalBadge signal={principle.signal} />
      </div>
      <p className="text-xs text-foreground leading-relaxed">{principle.evidence}</p>
      <p className="text-[11px] text-muted-foreground italic leading-relaxed">{principle.reasoning}</p>
    </div>
  );
}

export function QuantaFitScorecard({ fit }: { fit: QuantaFit }) {
  const strongCount = fit.principles.filter((p) => p.signal === "strong").length;
  const weakCount = fit.principles.filter((p) => p.signal === "weak").length;
  const unknownCount = fit.principles.filter((p) => p.signal === "unknown").length;

  return (
    <div className="space-y-4">
      <header className="rounded-md border bg-card p-4 flex items-start gap-4">
        <ScoreRing score={fit.compositeScore} />
        <div className="flex-1 space-y-2 min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <h3 className="font-semibold">Quanta fit</h3>
            <div className="flex gap-2 text-[10px] uppercase tracking-wide text-muted-foreground">
              <span className="text-primary">{strongCount} strong</span>
              <span>·</span>
              <span>{weakCount} weak</span>
              <span>·</span>
              <span className="text-muted-foreground/70">{unknownCount} unknown</span>
            </div>
          </div>
          <p className="text-sm text-foreground leading-relaxed">{fit.compositeReasoning}</p>
        </div>
      </header>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {fit.principles.map((p) => (
          <PrincipleCard key={p.name} principle={p} />
        ))}
      </div>
    </div>
  );
}
