import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { raiseProgress } from "@/lib/access";
import { formatMoney } from "@/lib/utils";
import { ROUND_LABELS } from "@/lib/constants";
import { ActivityFeed } from "@/components/activity-feed";
import { ProgressBar, Badge } from "@/components/ui";

export default async function FounderHome() {
  const user = await requireRole("FOUNDER");
  const company = await prisma.company.findUnique({
    where: { founderId: user.id },
    include: {
      raises: { orderBy: { createdAt: "desc" } },
    },
  });
  if (!company) {
    return (
      <div>
        <h1 className="text-2xl font-semibold">Set up your company</h1>
        <p className="mt-2 text-sm text-zinc-400">A raise needs a company profile first.</p>
        <Link href="/app/company" className="rd-btn-primary mt-4 inline-flex">
          Company profile
        </Link>
      </div>
    );
  }

  const active = company.raises.filter((r) => r.status === "ACTIVE");
  const raise = active[0] ?? company.raises[0];
  const progress = raise ? await raiseProgress(raise.id) : null;
  const pipelineCount = raise
    ? await prisma.pipelineEntry.count({ where: { raiseId: raise.id } })
    : 0;
  const activities = raise
    ? await prisma.activity.findMany({
        where: { raiseId: raise.id },
        include: { actor: { select: { name: true } } },
        orderBy: { createdAt: "desc" },
        take: 12,
      })
    : [];

  return (
    <div className="space-y-8">
      <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <p className="text-[11px] uppercase tracking-[0.16em] text-zinc-500">{company.location}</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">{company.name}</h1>
          <p className="mt-1 max-w-xl text-sm text-zinc-400">{company.tagline}</p>
        </div>
        <Link href="/app/raises/new" className="rd-btn-primary w-full shrink-0 justify-center sm:w-auto">
          New raise
        </Link>
      </div>

      {raise && progress ? (
        <div className="grid gap-4 lg:grid-cols-3">
          <Link href={`/app/raises/${raise.id}`} className="rd-card p-5 lg:col-span-2">
            <div className="flex items-start justify-between gap-2">
              <p className="text-sm font-medium">
                {raise.name} · {ROUND_LABELS[raise.round]}
              </p>
              <Badge className="shrink-0 bg-accent-500/15 text-accent-300 ring-accent-500/30">{raise.status}</Badge>
            </div>
            <p className="mt-4 text-2xl font-semibold tracking-tight sm:text-3xl">
              {formatMoney(progress.signed, progress.currency)}
              <span className="mt-1 block text-base font-normal text-zinc-500 sm:mt-0 sm:ml-2 sm:inline">
                of {formatMoney(progress.target, progress.currency)}
              </span>
            </p>
            <ProgressBar signed={progress.filledPercent} soft={progress.softPercent} className="mt-3" />
            <p className="mt-2 text-xs text-zinc-500">
              {progress.filledPercent}% signed · {progress.softPercent}% including soft circles · {pipelineCount}{" "}
              investors on the pipeline
            </p>
          </Link>
          <div className="rd-card p-5">
            <p className="text-sm font-medium">Quick actions</p>
            <div className="mt-3 flex flex-col gap-2">
              <Link href={`/app/raises/${raise.id}/pipeline`} className="rd-btn-ghost justify-start">
                Open pipeline
              </Link>
              <Link href={`/app/raises/${raise.id}/data-room`} className="rd-btn-ghost justify-start">
                Data room
              </Link>
              <Link href={`/app/raises/${raise.id}/updates`} className="rd-btn-ghost justify-start">
                Write an update
              </Link>
            </div>
          </div>
        </div>
      ) : (
        <div className="rd-card p-6">
          <p className="font-medium">No raise yet</p>
          <p className="mt-1 text-sm text-zinc-400">Open a pre-seed, seed, or Series A to start the pipeline.</p>
          <Link href="/app/raises/new" className="rd-btn-primary mt-4 inline-flex">
            Create raise
          </Link>
        </div>
      )}

      <section>
        <h2 className="mb-4 text-sm font-medium text-zinc-400">Activity</h2>
        <div className="rd-card p-5">
          <ActivityFeed items={activities} />
        </div>
      </section>
    </div>
  );
}
