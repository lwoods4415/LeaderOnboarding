import type { Metadata } from "next";
import { Growth } from "@/components/pages/Growth";

export const metadata: Metadata = { title: "My growth" };

export default function Page() {
  return <Growth />;
}
