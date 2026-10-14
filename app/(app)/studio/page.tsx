import type { Metadata } from "next";
import { Studio } from "@/components/pages/Studio";

// Shown only once the signed-in account has loaded (see AccountProvider), so it can't be validated for instant navigation.
export const instant = false;

export const metadata: Metadata = { title: "Practice studio" };

export default function Page() {
  return <Studio />;
}
