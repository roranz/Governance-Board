import { Suspense } from "react";
import { getAppState } from "@/lib/queries";
import { GanttView } from "@/components/gantt-view";
import { MilestonesPanel } from "@/components/milestones-panel";
import { AppFilter } from "@/components/app-filter";

export default async function GanttPage({
  searchParams,
}: {
  searchParams: Promise<{ appId?: string }>;
}) {
  const state = await getAppState();
  const params = await searchParams;
  const appId = params.appId ?? null;
  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-2.5">
        <h2 className="my-1 text-base font-semibold text-fg">Gantt</h2>
      </div>
      <Suspense fallback={null}>
        <AppFilter apps={state.apps} />
      </Suspense>
      <GanttView state={state} appId={appId} />
      <h2 className="mt-6 mb-3 text-base font-semibold text-fg">Milestones</h2>
      <MilestonesPanel state={state} />
    </div>
  );
}
