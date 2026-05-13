import { router } from "../trpc";
import { profileRouter } from "./profile";
import { companiesRouter } from "./companies";
import { contactsRouter } from "./contacts";
import { researchRouter } from "./research";
import { sourcesRouter } from "./sources";
import { dashboardRouter } from "./dashboard";

export const appRouter = router({
  profile: profileRouter,
  companies: companiesRouter,
  contacts: contactsRouter,
  research: researchRouter,
  sources: sourcesRouter,
  dashboard: dashboardRouter,
});

export type AppRouter = typeof appRouter;
