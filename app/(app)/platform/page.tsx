import type { Metadata } from "next";
import { Platform } from "@/components/pages/Platform";

// Shown only once the signed-in account has loaded (see AccountProvider), so it can't be validated for instant navigation.
export const instant = false;

// Approving or drafting starts Claude in the background, which can take a couple of minutes.
export const maxDuration = 300;

export const metadata: Metadata = { title: "Platform" };

export default function Page() {
  return <Platform />;
}
