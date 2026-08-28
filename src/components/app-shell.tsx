"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { logoutAction } from "@/lib/actions";
import type { SessionUser } from "@/lib/auth";
import { Logo } from "./ui";
import { ThemeToggle } from "./theme-toggle";
import { NavLinks } from "./nav-links";

function SidebarBody({
  user,
  nav,
  onNavigate,
}: {
  user: SessionUser;
  nav: { href: string; label: string }[];
  onNavigate?: () => void;
}) {
  const home = user.role === "INVESTOR" ? "/invest" : "/app";
  return (
    <>
      <Link href={home} onClick={onNavigate} className="px-2 pb-4">
        <Logo />
      </Link>
      <NavLinks items={nav} onNavigate={onNavigate} />
      <div className="mt-auto space-y-3 border-t border-white/10 pt-3">
        <div className="px-2">
          <p className="truncate text-sm font-medium">{user.name}</p>
          <p className="truncate text-[11px] uppercase tracking-wider text-zinc-500">
            {user.role.toLowerCase().replace("_", " ")}
          </p>
          <p className="truncate text-[11px] text-zinc-500">{user.email}</p>
        </div>
        <div className="flex items-center justify-between px-1">
          <ThemeToggle />
          <form action={logoutAction}>
            <button type="submit" className="px-2 py-2 text-sm text-zinc-500 hover:text-zinc-200">
              Sign out
            </button>
          </form>
        </div>
      </div>
    </>
  );
}

export function AppShell({
  user,
  nav,
  children,
}: {
  user: SessionUser;
  nav: { href: string; label: string }[];
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-white/10 bg-ink-950/90 px-4 py-3 backdrop-blur md:hidden">
        <Link href={user.role === "INVESTOR" ? "/invest" : "/app"}>
          <Logo />
        </Link>
        <button
          type="button"
          className="inline-flex h-11 w-11 items-center justify-center rounded-lg hover:bg-white/10"
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
        >
          <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2">
            {open ? (
              <path d="M6 6l12 12M18 6L6 18" />
            ) : (
              <>
                <path d="M4 7h16" />
                <path d="M4 12h16" />
                <path d="M4 17h16" />
              </>
            )}
          </svg>
        </button>
      </header>

      {open ? (
        <div className="fixed inset-0 z-40 md:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-black/60"
            aria-label="Close menu"
            onClick={() => setOpen(false)}
          />
          <aside className="absolute inset-y-0 left-0 flex w-[min(20rem,86vw)] flex-col border-r border-white/10 bg-ink-950 px-3 py-4 shadow-2xl">
            <SidebarBody user={user} nav={nav} onNavigate={() => setOpen(false)} />
          </aside>
        </div>
      ) : null}

      <aside className="sticky top-0 hidden h-screen w-56 shrink-0 flex-col border-r border-white/10 bg-ink-900/50 px-3 py-4 md:flex">
        <SidebarBody user={user} nav={nav} />
      </aside>
      <main className="min-w-0 flex-1 px-4 py-5 md:px-8 md:py-6">{children}</main>
    </div>
  );
}
