// Quanta-fit scorer. Evaluates a founder team against all 9 Quanta culture
// principles using the previously-gathered research artifacts. One JSON call,
// no fresh web search — synthesizes from overview / momentum / founder-content
// / founder-pedigree. Output stored on CompanyResearch.quantaFit.

export type QuantaPrinciple = {
  name: string;
  brief: string;
  operationalization: string;
};

export const DEFAULT_QUANTA_PRINCIPLES: QuantaPrinciple[] = [
  {
    name: "Kaizen",
    brief: "Continuous improvement. Questioning dogma. The worst answer is 'because it has always been done that way.'",
    operationalization: "Evidence of regular shipping, iteration loops, questioning assumptions, postmortems, or stated improvement of process. Stagnation is the anti-signal.",
  },
  {
    name: "Truth-seeking",
    brief: "Get to truth even when uncomfortable. Change views in light of new data. First-principles thinking. Ask 'why?' five times.",
    operationalization: "Evidence of changing positions publicly based on data, peer-reviewed work, sharp non-obvious views grounded in first principles, willingness to disagree with consensus.",
  },
  {
    name: "Customer Obsession",
    brief: "The most important person when building is the customer. Figure out who they are, get them extremely satisfied, fast responsive communication.",
    operationalization: "Evidence of direct customer engagement (responding to feedback, support visibility, NPS data), iterating in response to user input, naming specific customers.",
  },
  {
    name: "Initiative",
    brief: "Don't wait to be told what to do. Find the most impactful thing and do it. People who take initiative know they can always think of more impactful things to do.",
    operationalization: "Evidence of starting things without permission — side projects that became companies, public RFCs, organizing communities, building tools nobody asked for that solved a real problem.",
  },
  {
    name: "Prioritization",
    brief: "A single priority at any given moment. Not three. Know what it is and get it done.",
    operationalization: "Evidence of focused execution, public roadmaps that show ruthless scope-cutting, statements like 'we explicitly chose not to do X.'",
  },
  {
    name: "Insanely High Standards",
    brief: "How you do anything is how you do everything. Attention to detail. Test thoroughly or communicate that it hasn't been tested.",
    operationalization: "Visible craft in shipped work — design polish, documentation depth, testing rigor, deliberate technical decisions explained in writing. Anti-signal: visible sloppiness.",
  },
  {
    name: "Extreme Ownership",
    brief: "Every activity has an owner. Take responsibility for failures, mistakes, challenges. Clear communication; recipient-received is your responsibility.",
    operationalization: "Evidence of public accountability — owning a bad shipment, writing a postmortem, addressing critique head-on. Anti-signal: blame-shifting or silence after failure.",
  },
  {
    name: "Think Big and Long",
    brief: "World-changing scope. Years-ahead horizon. Few people think years ahead; that's where the biggest impacts are made.",
    operationalization: "Evidence of long-horizon thinking — multi-year vision statements, research bets that don't pay off for years, statements like 'this is a 10-year company.' Anti-signal: short-term metric-chasing.",
  },
  {
    name: "Integrity Matters",
    brief: "Do what you say. No lies. Front-page-of-the-internet test. Don't breach trust.",
    operationalization: "Track record of delivering on public commitments. Anti-signal: broken promises, deleted statements, or visible track record of overpromising and under-shipping.",
  },
];

export type QuantaFitInput = {
  companyName: string;
  thesisMarkdown: string | null;
  principles: QuantaPrinciple[];
  research: {
    overview: string | null;
    momentumSignal: string | null;
    founderContent: string | null;
    founderPedigree: string | null;
  };
};

export function quantaFitSystemPrompt(principles: QuantaPrinciple[]): string {
  return `You are an evaluation engine for Quanta Ventures, an AI-native venture studio + hedge fund + VC fund. Quanta's core thesis is that "the team you build is the company you build." They recruit top 0.01% in any field and look for founders who embody their culture principles.

Your job: given research about a founder team and Quanta's ${principles.length} culture principles, evaluate the team against each principle with citable evidence drawn ONLY from the provided research. Output STRICT JSON in this exact shape:

{
  "compositeScore": <integer 0-100>,
  "compositeReasoning": "<2-4 sentence overall judgment of fit, naming the strongest 2 principles and the weakest 1>",
  "principles": [
    {
      "name": "<principle name, must match input>",
      "signal": "strong" | "weak" | "unknown",
      "evidence": "<1-2 sentence finding grounded in the research, with the source quoted if helpful>",
      "reasoning": "<1 sentence why this evidence maps to a strong/weak/unknown signal for this principle>"
    },
    ...one entry per principle, in the order provided...
  ]
}

Rules:
- DO NOT invent evidence. If the research is silent on a principle, signal = "unknown" and evidence = "Not findable in current research."
- "strong" requires direct, citable evidence — a quote, a dated post, a shipped artifact, a verified credential.
- "weak" is for explicit anti-signals (broken commitments, public sloppiness, signs of stagnation) — not just absence of strong signal.
- compositeScore weights the 9 principles equally, but penalize unknown more than weak: a team with 9 unknowns scores in the 30s, a team with 5 strong + 4 unknown scores in the 70s, all strong scores 95+.
- compositeReasoning is the line the analyst will read first. Be specific and concrete — name the principle and the evidence.
- Output JSON only. No prose before or after.`;
}

export function quantaFitUserPrompt(input: QuantaFitInput): string {
  const principlesBlock = input.principles
    .map((p, i) => `${i + 1}. **${p.name}** — ${p.brief}\n   How to score: ${p.operationalization}`)
    .join("\n\n");

  const research = input.research;
  const researchBlock = [
    research.overview ? `### Company overview\n${research.overview}` : null,
    research.momentumSignal ? `### Momentum signal\n${research.momentumSignal}` : null,
    research.founderContent ? `### Founder content\n${research.founderContent}` : null,
    research.founderPedigree ? `### Founder pedigree\n${research.founderPedigree}` : null,
  ]
    .filter(Boolean)
    .join("\n\n");

  const thesis = input.thesisMarkdown?.trim()
    ? `### Quanta's thesis (for context)\n${input.thesisMarkdown}\n\n`
    : "";

  return `Evaluate **${input.companyName}** against Quanta's culture principles.

${thesis}### Principles to score against

${principlesBlock}

### Research artifacts

${researchBlock || "(No research available — score all principles as unknown.)"}`;
}
