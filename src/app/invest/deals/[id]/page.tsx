import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { AccessError, getRaiseForInvestor, listAccessibleFolders, raiseProgress } from "@/lib/access";
import { prisma } from "@/lib/prisma";
import { formatMoney, formatDateTime } from "@/lib/utils";
import { INSTRUMENT_LABELS, ROUND_LABELS } from "@/lib/constants";
import { ActivityFeed } from "@/components/activity-feed";
import { ProgressBar, StageBadge } from "@/components/ui";
import { InvestorActions } from "@/components/investor-actions";

export default async function DealPage({ params }: { params: { id: string } }) {
  const user = await requireUser();
  let raise;
  try {
    raise = await getRaiseForInvestor(params.id, user.id);
  } catch (e) {
    if (e instanceof AccessError) notFound();
    throw e;
  }
  const [progress, entry, updates, activities, folders] = await Promise.all([
    raiseProgress(raise.id),
    prisma.pipelineEntry.findUnique({
      where: { raiseId_investorId: { raiseId: raise.id, investorId: user.id } },
    }),
    prisma.investorUpdate.findMany({
      where: { raiseId: raise.id, published: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.activity.findMany({
      where: { raiseId: raise.id },
      include: { actor: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
    listAccessibleFolders(raise.id, user.id),
  ]);

  const fileCount = folders.reduce((n, f) => n + f.files.length, 0);

  return (
    <div className="space-y-6">
      <div>
        <p className="text-[11px] uppercase tracking-[0.16em] text-zinc-500">
          {raise.company.sector} · {raise.company.location}
        </p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">{raise.company.name}</h1>
        <p className="mt-1 max-w-2xl text-sm text-zinc-400">{raise.company.tagline}</p>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <section className="rd-card p-5 lg:col-span-2">
          <div className="flex items-center justify-between">
            <p className="text-sm text-zinc-400">
              {ROUND_LABELS[raise.round]} · {INSTRUMENT_LABELS[raise.instrument]} · {raise.name}
            </p>
            {entry ? <StageBadge stage={entry.stage} /> : null}
          </div>
          <p className="mt-4 text-3xl font-semibold tracking-tight">
            {formatMoney(progress.signed, progress.currency)}
            <span className="ml-2 text-base font-normal text-zinc-500">
              of {formatMoney(progress.target, progress.currency)}
            </span>
          </p>
          <ProgressBar signed={progress.filledPercent} soft={progress.softPercent} className="mt-3" />
          <p className="mt-2 text-xs text-zinc-500">{progress.filledPercent}% signed</p>
          {raise.summary ? <p className="mt-4 text-sm leading-relaxed text-zinc-300">{raise.summary}</p> : null}
          <div className="mt-5 flex flex-wrap gap-2">
            {raise.deckFileId ? (
              <a href={`/api/files/${raise.deckFileId}`} className="rd-btn-primary">
                View pitch deck
              </a>
            ) : null}
            <Link href={`/invest/deals/${raise.id}/data-room`} className="rd-btn-ghost">
              Data room · {fileCount} files you can access
            </Link>
          </div>
        </section>
        <section className="rd-card p-5">
          <h2 className="text-sm font-medium">Your signal</h2>
          <p className="mt-1 text-xs text-zinc-500">The founder sees this on their pipeline.</p>
          <div className="mt-4">
            <InvestorActions raiseId={raise.id} current={entry?.investorIntent ?? "NONE"} />
          </div>
        </section>
      </div>

      <section>
        <h2 className="mb-3 text-sm font-medium text-zinc-400">Updates from the founder</h2>
        <div className="space-y-3">
          {updates.length === 0 ? (
            <div className="rd-card p-5 text-sm text-zinc-500">No updates yet.</div>
          ) : (
            updates.map((u) => (
              <article key={u.id} className="rd-card p-5">
                <p className="text-[11px] text-zinc-500">{formatDateTime(u.createdAt)}</p>
                <h3 className="mt-1 font-medium">{u.title}</h3>
                <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-zinc-300">{u.body}</p>
              </article>
            ))
          )}
        </div>
      </section>

      <section className="rd-card p-5">
        <h2 className="mb-4 text-sm font-medium">Activity</h2>
        <ActivityFeed items={activities} />
      </section>
    </div>
  );
}
