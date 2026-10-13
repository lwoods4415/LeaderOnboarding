"use client";
import { useRouter } from "next/navigation";
import { update } from "@/lib/store";

/** Opens a conversation in the Practice studio, like the reference page's data-rp buttons. */
export function useOpenRoleplay() {
  const router = useRouter();
  return (id: string) => {
    update((d) => { d.rpSel = id; });
    router.push("/studio", { scroll: false });
  };
}
