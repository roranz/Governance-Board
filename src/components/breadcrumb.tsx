"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import type { Application, Project } from "@/lib/types";

export function Breadcrumb({
  apps,
  projects,
}: {
  apps: Application[];
  projects: Project[];
}) {
  const path = usePathname();
  const params = useSearchParams();
  const appId = params.get("appId");
  const projectId = params.get("projectId");

  if (!appId && !projectId) return null;

  const app = apps.find((a) => a.id === appId);
  const project = projects.find((p) => p.id === projectId);

  return (
    <div className="mb-3.5 flex flex-wrap items-center rounded-lg border border-edge bg-panel px-3 py-2 text-[13px]">
      <Link href={path} className="cursor-pointer text-fg-faint hover:text-fg">
        All
      </Link>
      {app && (
        <>
          <span className="mx-2 text-fg-faint">›</span>
          <Link
            href={`${path}?appId=${app.id}`}
            className="cursor-pointer text-accent hover:underline"
          >
            {app.name}
          </Link>
        </>
      )}
      {project && (
        <>
          <span className="mx-2 text-fg-faint">›</span>
          <span className="text-fg">{project.name}</span>
        </>
      )}
      <Link
        href={path}
        className="ml-auto cursor-pointer rounded-md border border-edge px-2.5 py-0.5 text-[11px] text-fg-dim hover:border-edge-hi"
      >
        ✕ clear filter
      </Link>
    </div>
  );
}
