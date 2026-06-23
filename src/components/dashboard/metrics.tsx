import Link from "next/link";
import type { AppState } from "@/lib/types";

export function DashboardMetrics({ state }: { state: AppState }) {
  const inProg = state.projects.filter((p) => p.status === "In corso").length;
  const openTasks = state.tasks.filter((t) => t.status !== "done").length;
  const openMs = state.milestones.filter((m) => !m.done).length;
  const metrics: { label: string; value: number; href: string }[] = [
    { label: "Applications", value: state.apps.length, href: "/apps" },
    { label: "Projects", value: state.projects.length, href: "/projects" },
    { label: "In progress", value: inProg, href: "/projects" },
    { label: "Open tasks", value: openTasks, href: "/board" },
    { label: "Open milestones", value: openMs, href: "/gantt" },
  ];

  return (
    <div className="mb-4 grid grid-cols-[repeat(auto-fit,minmax(130px,1fr))] gap-2.5">
      {metrics.map((m) => (
        <Link
          key={m.label}
          href={m.href}
          className="cursor-pointer rounded-xl border border-edge bg-panel px-4 py-3.5 transition-opacity hover:opacity-85"
        >
          <div className="text-xs text-fg-dim">{m.label}</div>
          <div className="mt-1 text-[23px] font-semibold text-fg">{m.value}</div>
        </Link>
      ))}
    </div>
  );
}
