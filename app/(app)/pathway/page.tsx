import type { Metadata } from "next";
import { Pathway } from "@/components/pages/Pathway";

// Shown only once the signed-in account has loaded (see AccountProvider), so it can't be validated for instant navigation.
export const instant = false;

export const metadata: Metadata = { title: "Performance pathway" };

export default function Page() {
  return <Pathway />;
}
