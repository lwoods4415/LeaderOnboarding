"use client";
// The signed-in leader's own program (their organization's copy), shared with every page.
// Pages call useProgram() instead of importing the content files, so each organization can have
// its own tailored version. Character backstories are never part of this (server only).
import { createContext, use } from "react";
import type { Module, Roleplay } from "@/content";
import type { ProgramContent } from "@/content/program";

export type Program = ProgramContent & {
  moduleById: (id: string) => Module | undefined;
  roleplayFor: (moduleId: string) => Roleplay | undefined;
};

export function makeProgram(content: ProgramContent): Program {
  return {
    ...content,
    moduleById: (id) => content.modules.find((m) => m.id === id),
    roleplayFor: (moduleId) => content.roleplays.find((r) => r.mod === moduleId),
  };
}

const ProgramContext = createContext<Program | null>(null);

export function ProgramProvider({ program, children }: { program: Program; children: React.ReactNode }) {
  return <ProgramContext value={program}>{children}</ProgramContext>;
}

/** The current leader's program. Only used inside the signed-in app, where it's always loaded. */
export function useProgram(): Program {
  const p = use(ProgramContext);
  if (!p) throw new Error("useProgram must be used inside the signed-in app");
  return p;
}
