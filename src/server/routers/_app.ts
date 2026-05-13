import { router } from "../trpc";
import { profileRouter } from "./profile";
import { companiesRouter } from "./companies";
import { contactsRouter } from "./contacts";
import { researchRouter } from "./research";
import { dashboardRouter } from "./dashboard";

export const appRouter = router({
  profile: profileRouter,
  companies: companiesRouter,
  contacts: contactsRouter,
  research: researchRouter,
  dashboard: dashboardRouter,
});

export type AppRouter = typeof appRouter;
