import type { Metadata } from "next";
import { LabGuide } from "@/components/pages/LabGuide";

// Shown only once the signed-in account has loaded (see AccountProvider), so it can't be validated for instant navigation.
export const instant = false;

export const metadata: Metadata = { title: "Leader lab guide" };

export default function Page() {
  return <LabGuide />;
}
