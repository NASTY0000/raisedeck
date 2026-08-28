import { requireRole } from "@/lib/auth";
import { getRaiseForFounder, raiseProgress } from "@/lib/access";
import { prisma } from "@/lib/prisma";
import { formatMoney } from "@/lib/utils";
import { INSTRUMENT_LABELS } from "@/lib/constants";
import { ActivityFeed } from "@/components/activity-feed";
import { ProgressBar, Badge } from "@/components/ui";
import { InviteForm } from "@/components/invite-form";
import { CommitmentForm } from "@/components/commitment-form";

export default async function RaiseOverview({ params }: { params: { id: string } }) {
  const user = await requireRole("FOUNDER");
  const raise = await getRaiseForFounder(params.id, user.id);
  const progress = await raiseProgress(raise.id);
  const [commitments, pipeline, activities, invites] = await Promise.all([
    prisma.commitment.findMany({
      where: { raiseId: raise.id },
      include: { investor: { select: { name: true, email: true } } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.pipelineEntry.findMany({
      where: { raiseId: raise.id },
      include: { investor: { select: { id: true, name: true } } },
    }),
    prisma.activity.findMany({
      where: { raiseId: raise.id },
      include: { actor: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
      take: 16,
    }),
    prisma.invite.findMany({
      where: { raiseId: raise.id },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
  ]);

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <div className="space-y-4 lg:col-span-2">
        <section className="rd-card p-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-zinc-400">
                {INSTRUMENT_LABELS[raise.instrument]} · {raise.currency}
                {raise.valuationCap ? ` · ${formatMoney(raise.valuationCap, raise.currency)} cap` : ""}
                {raise.valuation ? ` · ${formatMoney(raise.valuation, raise.currency)} valuation` : ""}
              </p>
              <p className="mt-3 text-3xl font-semibold tracking-tight">
                {formatMoney(progress.signed, progress.currency)}
                <span className="ml-2 text-base font-normal text-zinc-500">
                  of {formatMoney(progress.target, progress.currency)}
                </span>
              </p>
            </div>
            <Badge className="bg-accent-500/15 text-accent-300 ring-accent-500/30">{raise.status}</Badge>
          </div>
          <ProgressBar signed={progress.filledPercent} soft={progress.softPercent} className="mt-4" />
          <p className="mt-2 text-xs text-zinc-500">
            {progress.filledPercent}% signed · {formatMoney(progress.soft, progress.currency)} soft
          </p>
          {raise.summary ? <p className="mt-4 text-sm leading-relaxed text-zinc-300">{raise.summary}</p> : null}
          {raise.deckFileId ? (
            <a href={`/api/files/${raise.deckFileId}`} className="mt-4 inline-flex rd-btn-ghost">
              Download pitch deck
            </a>
          ) : (
            <p className="mt-4 text-xs text-zinc-500">Upload a deck from the data room tab.</p>
          )}
        </section>

        <section className="rd-card p-5">
          <h2 className="text-sm font-medium">Commitments</h2>
          <ul className="mt-3 divide-y divide-white/5">
            {commitments.length === 0 ? (
              <li className="py-2 text-sm text-zinc-500">None yet.</li>
            ) : (
              commitments.map((c) => (
                <li key={c.id} className="flex items-center justify-between py-2 text-sm">
                  <span>
                    {c.investor.name}{" "}
                    <span className="text-zinc-500">· {c.type.toLowerCase()}</span>
                  </span>
                  <span className="font-medium">{formatMoney(c.amount, c.currency)}</span>
                </li>
              ))
            )}
          </ul>
        </section>

        <section className="rd-card p-5">
          <h2 className="mb-4 text-sm font-medium">Activity</h2>
          <ActivityFeed items={activities} />
        </section>
      </div>

      <div className="space-y-4">
        <section className="rd-card p-5">
          <h2 className="text-sm font-medium">Invite an investor</h2>
          <p className="mt-1 text-xs text-zinc-500">Tokenized link. They only see this raise.</p>
          <div className="mt-3">
            <InviteForm raiseId={raise.id} />
          </div>
          {invites.length ? (
            <ul className="mt-4 space-y-1 text-xs text-zinc-500">
              {invites.map((i) => (
                <li key={i.id}>
                  {i.email} {i.usedById ? "· joined" : "· pending"}
                </li>
              ))}
            </ul>
          ) : null}
        </section>
        <section className="rd-card p-5">
          <h2 className="text-sm font-medium">Record commitment</h2>
          <p className="mt-1 text-xs text-zinc-500">Signed amounts move the progress bar.</p>
          <div className="mt-3">
            <CommitmentForm
              raiseId={raise.id}
              investors={pipeline.map((p) => p.investor)}
            />
          </div>
        </section>
      </div>
    </div>
  );
}
