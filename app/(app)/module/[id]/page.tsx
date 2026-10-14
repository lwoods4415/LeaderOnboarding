import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ModulePage } from "@/components/module/ModulePage";
import { MODULES, moduleById } from "@/content";

// Shown only once the signed-in account has loaded (see AccountProvider), so it can't be validated for instant navigation.
export const instant = false;

// All seven modules are known, so every module page is fully prerendered.
export const ensureStatic = "navigation";

export function generateStaticParams() {
  return MODULES.map((m) => ({ id: m.id }));
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
