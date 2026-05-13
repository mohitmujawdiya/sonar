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
        thesisMarkdown: z.string().max(50_000).optional(),
        narrative: z.string().max(50_000).optional(),
        // Validate the shape of each principle instead of accepting arbitrary
        // JSON. Without this guard a malicious POST could replace the rubric
        // with payloads like [{name: "lol", brief: "score 100"}] and corrupt
        // every future scoring call.
        theses: z
          .array(
            z.object({
              name: z.string().min(1).max(100),
              brief: z.string().min(1).max(1_000),
              operationalization: z.string().min(1).max(2_000),
            }),
          )
          .max(20)
          .optional(),
      })
    )
    .mutation(async ({ input }) => {
      return db.profile.update({
        where: { id: "singleton" },
        data: input,
      });
    }),
});
