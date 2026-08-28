"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export function NavLinks({
  items,
  onNavigate,
}: {
  items: { href: string; label: string }[];
  onNavigate?: () => void;
}) {
  const path = usePathname();
  return (
    <nav className="flex flex-1 flex-col gap-0.5">
      {items.map((item) => {
        const active =
          item.href === "/app" || item.href === "/invest"
            ? path === item.href
            : path === item.href || path.startsWith(item.href + "/");
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={cn(
              "rounded-md px-3 py-2.5 text-[15px] text-zinc-400 hover:bg-white/5 hover:text-zinc-100 md:py-1.5 md:text-[13px]",
              active && "bg-white/10 text-zinc-100",
            )}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
