import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ModulePage } from "@/components/module/ModulePage";
import { MODULES, moduleById } from "@/content";

// All seven modules are known, so every module page is fully prerendered.
export const ensureStatic = "navigation";

export function generateStaticParams() {
  return MODULES.map((m) => ({ id: m.id }));
}

export async function generateMetadata({ params }: PageProps<"/module/[id]">): Promise<Metadata> {
  const m = moduleById((await params).id);
  return { title: m ? `${m.weeks}: ${m.short}` : "Not found" };
}

// The URL is read inside Suspense so the shared page shell stays instant to navigate to.
export default function Page({ params }: PageProps<"/module/[id]">) {
  return (
    <Suspense fallback={null}>
      <Module params={params} />
    </Suspense>
  );
}

async function Module({ params }: { params: PageProps<"/module/[id]">["params"] }) {
  const { id } = await params;
  if (!moduleById(id)) notFound();
  return <ModulePage id={id} />;
}
