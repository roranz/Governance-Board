"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import type { Application } from "@/lib/types";

export function AppFilter({ apps }: { apps: Application[] }) {
  const path = usePathname();
  const params = useSearchParams();
  const current = params.get("appId");

  return (
    <div className="mb-4 flex flex-wrap gap-2">
      <Link
        href={path}
        className={
          "cursor-pointer rounded-full border border-edge px-3 py-1 text-[12.5px] transition-colors " +
          (!current
            ? "border-accent bg-accent-dim font-medium text-fg"
            : "bg-panel text-fg-dim hover:text-fg")
        }
      >
        All
      </Link>
      {apps.map((a) => {
        const active = current === a.id;
        return (
          <Link
            key={a.id}
            href={`${path}?appId=${a.id}`}
            className={
              "flex cursor-pointer items-center rounded-full border px-3 py-1 text-[12.5px] transition-colors " +
              (active
                ? "border-accent bg-accent-dim font-medium text-fg"
                : "border-edge bg-panel text-fg-dim hover:text-fg")
            }
          >
            <span
              className="mr-2 inline-block h-2 w-2 rounded-full"
              style={{ background: a.color }}
            />
            {a.name}
          </Link>
        );
      })}
    </div>
  );
}
