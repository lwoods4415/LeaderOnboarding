import type { Metadata } from "next";
import { Platform } from "@/components/pages/Platform";

// Shown only once the signed-in account has loaded (see AccountProvider), so it can't be validated for instant navigation.
export const instant = false;

export const metadata: Metadata = { title: "Platform" };

export default function Page() {
  return <Platform />;
}
