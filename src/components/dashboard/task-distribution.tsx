import Link from "next/link";
import type { Task } from "@/lib/types";
import { KCOLS } from "@/lib/theme";

export function TaskDistribution({ tasks }: { tasks: Task[] }) {
  const tot = tasks.length || 1;
  return (
    <div className="rounded-xl border border-edge bg-panel p-4">
      {KCOLS.map((c) => {
        const n = tasks.filter((t) => t.status === c.id).length;
        return (
          <Link
            key={c.id}
            href="/board"
            className="mb-3 block cursor-pointer transition-opacity hover:opacity-85"
          >
            <div className="mb-1 flex items-center justify-between">
              <span className="text-[13px] text-fg-dim">
                <span
                  className="mr-2 inline-block h-2 w-2 rounded-full"
                  style={{ background: c.color }}
                />
                {c.label}
              </span>
              <span className="text-[13px] text-fg">{n}</span>
            </div>
            <div className="h-[7px] overflow-hidden rounded bg-panel2">
              <div
                className="h-full rounded transition-[width] duration-300"
                style={{ width: `${(n / tot) * 100}%`, background: c.color }}
              />
            </div>
          </Link>
        );
      })}
    </div>
  );
}
