import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { raiseProgress } from "@/lib/access";
import { formatMoney } from "@/lib/utils";
import { ROUND_LABELS, INSTRUMENT_LABELS } from "@/lib/constants";
import { Badge, ProgressBar } from "@/components/ui";

export default async function RaisesPage() {
  const user = await requireRole("FOUNDER");
  const company = await prisma.company.findUnique({
    where: { founderId: user.id },
    include: { raises: { orderBy: { createdAt: "desc" } } },
  });
  const raises = company?.raises ?? [];

  const rows = await Promise.all(
    raises.map(async (r) => ({ raise: r, progress: await raiseProgress(r.id) })),
  );

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Raises</h1>
          <p className="mt-1 text-sm text-zinc-400">Rounds, instruments, and how full they are.</p>
        </div>
        <Link href="/app/raises/new" className="rd-btn-primary">
          New raise
        </Link>
      </div>
      <div className="mt-6 space-y-3">
        {rows.length === 0 ? (
          <div className="rd-card p-6 text-sm text-zinc-400">No raises yet.</div>
        ) : (
          rows.map(({ raise, progress }) => (
            <Link
              key={raise.id}
              href={`/app/raises/${raise.id}`}
              className="rd-card block p-5 hover:border-accent/30"
            >
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="font-medium">
                    {raise.name}{" "}
                    <span className="text-zinc-500">· {ROUND_LABELS[raise.round]}</span>
                  </p>
                  <p className="mt-1 text-xs text-zinc-500">
                    {INSTRUMENT_LABELS[raise.instrument]} · {formatMoney(raise.targetAmount, raise.currency)} target
                  </p>
                </div>
                <Badge
                  className={
                    raise.status === "ACTIVE"
                      ? "bg-accent-500/15 text-accent-300 ring-accent-500/30"
                      : "bg-white/10 text-zinc-300 ring-white/10"
                  }
                >
                  {raise.status}
                </Badge>
              </div>
              <ProgressBar signed={progress.filledPercent} soft={progress.softPercent} className="mt-4" />
              <p className="mt-2 text-xs text-zinc-500">{progress.filledPercent}% signed</p>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
