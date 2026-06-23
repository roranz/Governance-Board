import { getAppState } from "@/lib/queries";
import { AppsView } from "@/components/apps-view";

export default async function AppsPage() {
  const state = await getAppState();
  return <AppsView state={state} />;
}
