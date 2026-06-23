import { Suspense } from "react";
import { getAppState } from "@/lib/queries";
import { BoardView } from "@/components/board-view";
import { Breadcrumb } from "@/components/breadcrumb";

export default async function BoardPage({
  searchParams,
}: {
  searchParams: Promise<{ appId?: string; projectId?: string }>;
}) {
  const state = await getAppState();
  const params = await searchParams;
  return (
    <>
      <Suspense fallback={null}>
        <Breadcrumb apps={state.apps} projects={state.projects} />
      </Suspense>
      <BoardView
        state={state}
        appId={params.appId ?? null}
        projectId={params.projectId ?? null}
      />
    </>
  );
}
