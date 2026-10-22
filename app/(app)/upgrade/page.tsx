import type { Metadata } from "next";
import { Upgrade } from "@/components/pages/Upgrade";

// Shown only once the signed-in account has loaded (see AccountProvider), so it can't be validated for instant navigation.
export const instant = false;

export const metadata: Metadata = { title: "Your plan" };

export default function Page() {
  return <Upgrade />;
}
