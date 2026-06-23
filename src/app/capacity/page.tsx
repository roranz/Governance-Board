import { Suspense } from "react";
import { getAppState } from "@/lib/queries";
import { CapacityView } from "@/components/capacity-view";
import { AppFilter } from "@/components/app-filter";

export default async function CapacityPage({
  searchParams,
}: {
  searchParams: Promise<{ appId?: string }>;
}) {
  const state = await getAppState();
  const params = await searchParams;
  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-2.5">
        <h2 className="my-1 text-base font-semibold text-fg">Capacity planning</h2>
      </div>
      <Suspense fallback={null}>
        <AppFilter apps={state.apps} />
      </Suspense>
      <CapacityView state={state} appId={params.appId ?? null} />
    </div>
  );
}
