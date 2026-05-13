import { router, publicProcedure } from "../trpc";
import { db } from "../db";

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
});
