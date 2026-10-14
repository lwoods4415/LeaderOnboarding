import type { Metadata } from "next";
import { Admin } from "@/components/pages/Admin";

// Shown only once the signed-in account has loaded (see AccountProvider), so it can't be validated for instant navigation.
export const instant = false;

export const metadata: Metadata = { title: "Leaders and cohorts" };

export default function Page() {
  return <Admin />;
}
