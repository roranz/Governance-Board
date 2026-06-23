import Link from "next/link";
import type { Application, Project } from "@/lib/types";

export function ProjectProgress({
  apps,
  projects,
}: {
  apps: Application[];
  projects: Project[];
}) {
  return (
    <div className="rounded-xl border border-edge bg-panel p-4">
      {projects.map((p) => {
        const app = apps.find((a) => a.id === p.appId);
        return (
          <Link
            key={p.id}
            href={`/board?appId=${p.appId}&projectId=${p.id}`}
            className="mb-3 block cursor-pointer transition-opacity hover:opacity-85"
          >
            <div className="mb-1 flex items-center justify-between">
              <span className="text-[13px] text-fg">
                <span
                  className="mr-2 inline-block h-2 w-2 rounded-full"
                  style={{ background: app?.color }}
                />
                {p.name}
              </span>
              <span className="text-xs text-fg-dim">{p.progress}%</span>
            </div>
            <div className="h-[7px] overflow-hidden rounded bg-panel2">
              <div
                className="h-full rounded transition-[width] duration-300"
                style={{ width: `${p.progress}%`, background: app?.color }}
              />
            </div>
          </Link>
        );
      })}
      {!projects.length && (
        <div className="py-2 text-[13px] text-fg-faint">No projects.</div>
      )}
    </div>
  );
}
