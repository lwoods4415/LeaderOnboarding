import type { Metadata } from "next";
import { SponsorGuide } from "@/components/pages/SponsorGuide";

// Shown only once the signed-in account has loaded (see AccountProvider), so it can't be validated for instant navigation.
export const instant = false;

export const metadata: Metadata = { title: "For your leader" };

export default function Page() {
  return <SponsorGuide />;
}
