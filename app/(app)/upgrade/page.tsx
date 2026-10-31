import type { Metadata } from "next";
import { Upgrade } from "@/components/pages/Upgrade";

// Shown only once the signed-in account has loaded (see AccountProvider), so it can't be validated for instant navigation.
export const instant = false;

// Tailoring lessons runs in the background after the form is sent, which can take a couple of minutes.
export const maxDuration = 300;

export const metadata: Metadata = { title: "Your plan" };

export default function Page() {
  return <Upgrade />;
}
