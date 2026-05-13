import { router } from "../trpc";
import { profileRouter } from "./profile";
import { companiesRouter } from "./companies";
import { contactsRouter } from "./contacts";
import { researchRouter } from "./research";
import { dashboardRouter } from "./dashboard";
import { scanRouter } from "./scan";

export const appRouter = router({
  profile: profileRouter,
  companies: companiesRouter,
  contacts: contactsRouter,
  research: researchRouter,
  dashboard: dashboardRouter,
  scan: scanRouter,
});

export type AppRouter = typeof appRouter;
