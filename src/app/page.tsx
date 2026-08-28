import Link from "next/link";
import { getSessionUser } from "@/lib/auth";
import { homeForRole } from "@/lib/auth";
import { Logo } from "@/components/ui";
import { ThemeToggle } from "@/components/theme-toggle";

export default async function LandingPage() {
  const user = await getSessionUser();
  return (
    <div className="min-h-screen">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
        <Logo />
        <div className="flex items-center gap-3">
          <ThemeToggle />
          {user ? (
            <Link href={homeForRole(user.role)} className="rd-btn-primary">
              Open app
            </Link>
          ) : (
            <>
              <Link href="/login" className="text-sm text-zinc-400 hover:text-zinc-100">
                Sign in
              </Link>
              <Link href="/register" className="rd-btn-primary">
                Get started
              </Link>
            </>
          )}
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-6 pb-8 pt-16">
        <p className="mb-4 text-[11px] font-medium uppercase tracking-[0.2em] text-accent-400">
          Fundraising OS
        </p>
        <h1 className="max-w-3xl text-5xl font-semibold leading-[1.05] tracking-tight">
          Your raise, off WhatsApp.
          <span className="block text-zinc-500">Decks, pipeline, data room, updates.</span>
        </h1>
        <p className="mt-6 max-w-xl text-[15px] leading-relaxed text-zinc-400">
          Founders run a round in one place. Investors only see the deals they were invited to.
          No public spray, no shared inbox archaeology.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/register?role=FOUNDER" className="rd-btn-primary px-4 py-2.5">
            I&apos;m raising
          </Link>
          <Link href="/register?role=INVESTOR" className="rd-btn-ghost px-4 py-2.5">
            I&apos;m investing
          </Link>
        </div>
        <p className="mt-4 font-mono text-xs text-zinc-500">
          Demo · ada@raisedeck.demo / demo1234 · amara@raisedeck.demo / demo1234
        </p>
      </section>

      <section className="mx-auto grid max-w-6xl gap-3 px-6 pb-20 md:grid-cols-3">
        {[
          {
            k: "01",
            t: "Pipeline CRM",
            d: "Intro → meeting → DD → term sheet → committed or passed. Next actions, notes, intro source.",
          },
          {
            k: "02",
            t: "Data room lite",
            d: "Folders, local uploads, and per-investor access. Deck for everyone invited; financials only when you say so.",
          },
          {
            k: "03",
            t: "Invite, don\u2019t spray",
            d: "Tokenized links for a named investor. They see your raise. They never see the other founder\u2019s.",
          },
        ].map((c) => (
          <div key={c.k} className="rd-card p-5">
            <p className="font-mono text-[11px] text-accent-400">{c.k}</p>
            <h2 className="mt-2 text-base font-medium">{c.t}</h2>
            <p className="mt-2 text-sm leading-relaxed text-zinc-400">{c.d}</p>
          </div>
        ))}
      </section>
    </div>
  );
}
