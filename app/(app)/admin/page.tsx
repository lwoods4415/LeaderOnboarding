import type { Metadata } from "next";
import { Admin } from "@/components/pages/Admin";

export const metadata: Metadata = { title: "Leaders and cohorts" };

export default function Page() {
  return <Admin />;
}
