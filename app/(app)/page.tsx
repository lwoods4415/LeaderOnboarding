import { Overview } from "@/components/pages/Overview";

// Shown only once the signed-in account has loaded (see AccountProvider), so it can't be validated for instant navigation.
export const instant = false;

export default function Page() {
  return <Overview />;
}
