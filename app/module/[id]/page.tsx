import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ModulePage } from "@/components/module/ModulePage";
import { MODULES, moduleById } from "@/content";

export function generateStaticParams() {
  return MODULES.map((m) => ({ id: m.id }));
}

export async function generateMetadata({ params }: PageProps<"/module/[id]">): Promise<Metadata> {
  const m = moduleById((await params).id);
  return { title: m ? `${m.weeks}: ${m.short}` : "Not found" };
}

export default async function Page({ params }: PageProps<"/module/[id]">) {
  const { id } = await params;
  if (!moduleById(id)) notFound();
  return <ModulePage id={id} />;
}
