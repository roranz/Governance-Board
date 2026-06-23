"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/", label: "Dashboard", icon: "◫" },
  { href: "/apps", label: "Applications", icon: "▦" },
  { href: "/projects", label: "Projects", icon: "▤" },
  { href: "/board", label: "Tasks", icon: "▥" },
  { href: "/gantt", label: "Gantt", icon: "▰" },
  { href: "/capacity", label: "Capacity", icon: "◷" },
  { href: "/todos", label: "My tasks", icon: "✓" },
];

export function Nav() {
  const path = usePathname();
  return (
    <nav className="mb-3.5 flex flex-wrap gap-0.5 border-b border-edge">
      {TABS.map((t) => {
        const active = path === t.href;
        return (
          <Link
            key={t.href}
            href={t.href}
            className={
              "border-b-2 px-3 py-2.5 text-[13.5px] transition-colors hover:text-fg " +
              (active
                ? "border-accent font-medium text-accent"
                : "border-transparent text-fg-dim")
            }
          >
            <span className="mr-1.5 opacity-80">{t.icon}</span>
            {t.label}
          </Link>
        );
      })}
    </nav>
  );
}
