import { z } from "zod";
import { router, publicProcedure } from "../trpc";
import { db } from "../db";

export const profileRouter = router({
  get: publicProcedure.query(async () => {
    return db.profile.findUniqueOrThrow({ where: { id: "singleton" } });
  }),

  update: publicProcedure
    .input(
      z.object({
        thesisMarkdown: z.string().optional(),
        narrative: z.string().optional(),
        theses: z.array(z.any()).optional(),
      })
    )
    .mutation(async ({ input }) => {
      return db.profile.update({
        where: { id: "singleton" },
        data: input,
      });
    }),
});
