import type { Metadata } from "next";
import { Dashboard } from "@/components/pages/Dashboard";

// Shown only once the signed-in account has loaded (see AccountProvider), so it can't be validated for instant navigation.
export const instant = false;

export const metadata: Metadata = { title: "Cohort dashboard" };

export default function Page() {
  return <Dashboard />;
}
