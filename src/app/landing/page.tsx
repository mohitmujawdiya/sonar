import { redirect } from "next/navigation";

// Landing content moved to `/` after deploy. Keep /landing as a redirect so
// any prior links (emails, doc cross-references) don't 404.
export default function LandingRedirect() {
  redirect("/");
}
