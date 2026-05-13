// Four research prompts. Run in parallel per company on the Sourced →
// Researched transition. Results cached 14d in ResearchCache. The OpenAI
// Responses API with web_search returns text + url_citation annotations.

export type CompanyContext = {
  name: string;
  domain: string | null;
};

export function companyOverviewPrompt(c: CompanyContext): string {
  const ident = c.domain ? `${c.name} (${c.domain})` : c.name;
  return `What is ${ident}? Answer in 5-7 sentences covering:
1. What the company does (one-sentence elevator pitch).
2. Stage and size (founded year, headcount range, last funding round if known, lead investor).
3. Sector / vertical.
4. **Founders** — list each by name with current title, prior background (where they worked / what they built / what they studied), and a public LinkedIn or Twitter URL where possible.
5. Tech stack signal (public blog posts, conference talks, open-source repos, model releases).
6. One recent product or company milestone (last 12 months).
7. Customer signal — named logos, ARR if public, or "no public customers" if none findable.

Be concrete and source-grounded. Use citations. If you can't find a fact, say "not found" rather than inventing. Bias toward findings about the **founder team**, since the team is the unit of evaluation here.`;
}

export function momentumSignalPrompt(c: CompanyContext): string {
  const ident = c.domain ? `${c.name} (${c.domain})` : c.name;
  return `Look at how often ${ident} ships, writes, and learns in public. Focus on the last 90 days.

Cover these signals, with citations:

**Shipping cadence**
- How frequently is the product (or model, or repo) updated? Release notes, changelogs, model checkpoints, GitHub commit frequency on the main repo, npm/PyPI publish dates.
- Are new features shipping weekly, monthly, quarterly, or stale?

**Public learning loops**
- Are the founders posting build-in-public threads, postmortems, or technical blog posts? Linking to specific posts.
- Are they responding to user feedback publicly (X, Discord, Reddit, HN)?
- Are they iterating in response to that feedback — visible "we shipped X because someone said Y" moments?

**Quality of iteration**
- Is each release substantive or cosmetic? A model that drops a quantization in week 3 after release vs. one that ships a marketing video.
- Are they making the product better, or making more product?

End with a 1-paragraph synthesis: is this team in a tight shipping-and-learning loop, or stagnant? Cite the strongest single piece of evidence.

This is a Kaizen-shaped read — we're scoring whether they continuously improve, not how big they got.`;
}

export function founderContentPrompt(c: CompanyContext): string {
  const ident = c.domain ? `${c.name} (${c.domain})` : c.name;
  return `Find the most recent 5-8 LinkedIn, Twitter, or substack/blog posts from ${ident}'s founders or executives. For each:
- Author name + title
- Date posted (month and year minimum, exact date if findable)
- One-sentence summary of what they said
- A direct quote or notable phrase (≤25 words)
- The post URL

If no recent posts are findable, say so explicitly. Don't invent.

Then add a section labeled "SIGNAL THREADS" with 2-3 of the most concrete reference points — posts where the founder demonstrates first-principles reasoning, changes their mind based on evidence, takes public accountability for a mistake, or articulates a sharp non-obvious view. Each thread is one sentence in this format:
"[Author name] [date]: [what they said / did that was notable] — quote: 'exact phrase ≤20 words'"

Bias toward specificity: a dated post showing the founder updating a position based on data beats a vague observation about industry trends.`;
}

export function founderPedigreePrompt(c: CompanyContext): string {
  const ident = c.domain ? `${c.name} (${c.domain})` : c.name;
  return `For each founder of ${ident}, search for evidence that they have been in the **top 0.01%** of any field they've previously committed to. Look in any of:

- Competitive achievement at scale (national / international championships, ranked competitive games, olympiads, top placement at meaningful contests — chess GM, USAMO finalist, top-50 chess.com, WSOP cashes, national-level golf/tennis/swimming, etc.)
- Academic recognition (PhD from a top-5 program with notable advisor, peer-reviewed publications in top venues with non-trivial citation counts, research-track awards)
- Prior built-and-shipped work (founded a previous company that exited, sold a product, shipped a widely-used open-source tool with >5k stars or substantial downstream usage)
- Hedge-fund / quant / trading-desk track record (P&L visibility, partner-level role)
- Anything else that signals mastery in a field that punishes mediocrity

For each founder, output:
- **Name** — Their best mastery signal in one sentence, with citation URL.
- **Other signals** — any secondary mastery evidence (1-3 bullets).
- **Verdict** — "Top-0.01% signal present" / "Strong-but-not-extraordinary" / "No mastery signal findable"

Don't invent. If a founder has no findable mastery signal, say so directly. "Engineer at FAANG" alone is not a top-0.01% signal.

End with a 1-paragraph synthesis: does this team have the mastery-track-record Quanta looks for? Cite the strongest single piece of evidence.`;
}
