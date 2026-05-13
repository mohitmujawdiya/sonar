import { z } from "zod";
import { router, publicProcedure } from "../trpc";
import { runScan } from "../services/scan-engine";

const ScanSourceIdEnum = z.enum(["hn", "github", "huggingface"]);

export const scanRouter = router({
  run: publicProcedure
    .input(z.object({ sources: z.array(ScanSourceIdEnum).min(1) }))
    .mutation(async ({ input }) => {
      return runScan(input.sources);
    }),
});
