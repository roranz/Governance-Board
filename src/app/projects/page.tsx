import { getAppState } from "@/lib/queries";
import { ProjectsView } from "@/components/projects-view";
import { Breadcrumb } from "@/components/breadcrumb";
import { Suspense } from "react";

export default async function ProjectsPage({
  searchParams,
}: {
  searchParams: Promise<{ appId?: string }>;
}) {
  const state = await getAppState();
  const params = await searchParams;
  return (
    <>
      <Suspense fallback={null}>
        <Breadcrumb apps={state.apps} projects={state.projects} />
      </Suspense>
      <ProjectsView state={state} appId={params.appId ?? null} />
    </>
  );
}
