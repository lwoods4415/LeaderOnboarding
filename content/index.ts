// The Leading People protocol's content. Other protocols can sit beside it later.
export * from "./leading-people/modules";
export * from "./leading-people/roleplays";
export * from "./leading-people/pathway";
export * from "./leading-people/growth";
export * from "./leading-people/toolkit";
export * from "./leading-people/program";
export type * from "./types";

import { MODULES } from "./leading-people/modules";
import { ROLEPLAYS } from "./leading-people/roleplays";

export const roleplayFor = (moduleId: string) => ROLEPLAYS.find((r) => r.mod === moduleId);
export const moduleById = (id: string) => MODULES.find((m) => m.id === id);
