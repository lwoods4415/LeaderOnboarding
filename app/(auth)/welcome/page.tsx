import type { Metadata } from "next";
import { Landing } from "@/components/Landing";

export const metadata: Metadata = {
  title: { absolute: "Leader Onboarding: a 12-week program for first-time leaders" },
  description: "A promotion is a new job. We onboard it like one. Learn what changes when you start leading people, and practice the hard conversations with an AI partner. Start free.",
};

// The public home page. Signed-out visitors to the site's address land here (see proxy.ts).
export default function Page() {
  return <Landing />;
}
