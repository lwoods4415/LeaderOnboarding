import type { Metadata } from "next";
import { Studio } from "@/components/pages/Studio";

export const metadata: Metadata = { title: "Practice studio" };

export default function Page() {
  return <Studio />;
}
