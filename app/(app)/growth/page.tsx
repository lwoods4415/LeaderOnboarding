import type { Metadata } from "next";
import { Growth } from "@/components/pages/Growth";

// Shown only once the signed-in account has loaded (see AccountProvider), so it can't be validated for instant navigation.
export const instant = false;

export const metadata: Metadata = { title: "My growth" };

export default function Page() {
  return <Growth />;
}
