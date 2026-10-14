import type { Metadata } from "next";
import { Header } from "@/components/Header";
import { Confirm } from "./Confirm";

export const metadata: Metadata = { title: "Sign in" };

export default function Page() {
  return (
    <>
      <Header />
      <Confirm />
    </>
  );
}
