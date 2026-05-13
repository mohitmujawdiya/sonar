import { router, publicProcedure } from "../trpc";
import { db } from "../db";

const FORWARD_STAGES = ["Sourced", "Researched", "Watching", "Met"] as const;
const ALL_STAGES = ["Sourced", "Researched", "Watching", "Met", "Passed"] as const;
type Stage = (typeof ALL_STAGES)[number];

function median(xs: number[]): number | null {
  if (xs.length === 0) return null;
  const sorted = [...xs].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

export const dashboardRouter = router({
  summary: publicProcedure.query(async () => {
    const companiesByStatus = await db.company.groupBy({
      by: ["status"],
      _count: { _all: true },
    });

    const totalCompanies = companiesByStatus.reduce((acc, c) => acc + c._count._all, 0);

    return {
      companies: {
        total: totalCompanies,
        byStatus: companiesByStatus.map((c) => ({ status: c.status, count: c._count._all })),
      },
    };
  }),

  conversion: publicProcedure.query(async () => {
    const companies = await db.company.findMany({
      select: {
        id: true,
        createdAt: true,
        activityLogs: {
          where: { type: "company-status-changed" },
          select: { createdAt: true, payload: true },
          orderBy: { createdAt: "asc" },
        },
      },
    });

    const reached = new Map<Stage, Set<string>>(ALL_STAGES.map((s) => [s, new Set<string>()]));
    const completedDwell = new Map<Stage, number[]>(ALL_STAGES.map((s) => [s, [] as number[]]));

    for (const c of companies) {
      // Timeline starts at Sourced (createdAt) since the initial state isn't logged.
      const timeline: Array<{ stage: Stage; at: number }> = [
        { stage: "Sourced", at: c.createdAt.getTime() },
      ];
      for (const log of c.activityLogs) {
        const payload = log.payload as { from?: string; to?: string } | null;
        const to = payload?.to;
        if (!to || !(ALL_STAGES as readonly string[]).includes(to)) continue;
        timeline.push({ stage: to as Stage, at: log.createdAt.getTime() });
      }

      for (const step of timeline) reached.get(step.stage)!.add(c.id);

      // Only count completed dwell segments — the tail (current stage) is open-ended
      // and would bias the metric, so we read this as "median time to advance".
      for (let i = 0; i < timeline.length - 1; i++) {
        const dt = timeline[i + 1].at - timeline[i].at;
        if (dt > 0) completedDwell.get(timeline[i].stage)!.push(dt);
      }
    }

    const funnel = FORWARD_STAGES.map((stage, i) => {
      const count = reached.get(stage)!.size;
      const prev = i === 0 ? null : reached.get(FORWARD_STAGES[i - 1])!.size;
      const rate = prev && prev > 0 ? count / prev : null;
      return { stage, count, rate };
    });

    const dwell = ALL_STAGES.map((stage) => ({
      stage,
      medianMs: median(completedDwell.get(stage)!),
      samples: completedDwell.get(stage)!.length,
    }));

    const total = companies.length;
    const passedCount = reached.get("Passed")!.size;
    const passRate = total > 0 ? passedCount / total : null;

    return { funnel, dwell, total, passedCount, passRate };
  }),
});
