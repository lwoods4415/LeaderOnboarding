import type { Metadata } from "next";
import { Toolkit } from "@/components/pages/Toolkit";

// Shown only once the signed-in account has loaded (see AccountProvider), so it can't be validated for instant navigation.
export const instant = false;

export const metadata: Metadata = { title: "Toolkit" };

export default function Page() {
  return <Toolkit />;
}
