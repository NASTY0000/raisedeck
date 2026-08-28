"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export function RaiseTabs({ raiseId }: { raiseId: string }) {
  const path = usePathname();
  const base = `/app/raises/${raiseId}`;
  const items = [
    { href: base, label: "Overview" },
    { href: `${base}/pipeline`, label: "Pipeline" },
    { href: `${base}/data-room`, label: "Data room" },
    { href: `${base}/updates`, label: "Updates" },
  ];
  return (
    <div className="mb-6 flex gap-1 overflow-x-auto border-b border-white/10 pb-px [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {items.map((item) => {
        const active = item.href === base ? path === base : path.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "-mb-px shrink-0 border-b-2 border-transparent px-3 py-2.5 text-sm text-zinc-500 hover:text-zinc-200",
              active && "border-accent-400 text-zinc-100",
            )}
          >
            {item.label}
          </Link>
        );
      })}
    </div>
  );
}
