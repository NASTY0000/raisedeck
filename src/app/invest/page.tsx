import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PIPELINE_STAGES, STAGE_LABELS, ROUND_LABELS } from "@/lib/constants";
import { formatMoney } from "@/lib/utils";
import { StageBadge } from "@/components/ui";

export default async function InvestHome() {
  const user = await requireUser();
  const entries = await prisma.pipelineEntry.findMany({
    where: { investorId: user.id },
    include: {
      raise: { include: { company: true } },
    },
    orderBy: { updatedAt: "desc" },
  });

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Dealflow</h1>
        <p className="mt-1 text-sm text-zinc-400">
          Only raises you were invited to. Not a public feed.
        </p>
      </div>
      {entries.length === 0 ? (
        <div className="rd-card p-6 text-sm text-zinc-400">
          No deals yet. Ask a founder for an invite link.
        </div>
      ) : (
        <div className="flex gap-3 overflow-x-auto pb-4">
          {PIPELINE_STAGES.map((stage) => {
            const col = entries.filter((e) => e.stage === stage);
            return (
              <div key={stage} className="w-72 shrink-0">
                <div className="mb-2 flex items-center justify-between px-1">
                  <p className="text-[12px] font-medium text-zinc-400">{STAGE_LABELS[stage]}</p>
                  <span className="font-mono text-[11px] text-zinc-600">{col.length}</span>
                </div>
                <div className="space-y-2">
                  {col.map((e) => (
                    <Link key={e.id} href={`/invest/deals/${e.raiseId}`} className="rd-card block p-3 hover:border-accent/30">
                      <p className="text-sm font-medium">{e.raise.company.name}</p>
                      <p className="text-[11px] text-zinc-500">
                        {ROUND_LABELS[e.raise.round]} · {formatMoney(e.raise.targetAmount, e.raise.currency)}
                      </p>
                      <div className="mt-2">
                        <StageBadge stage={e.stage} />
                      </div>
                    </Link>
                  ))}
                  {col.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-white/10 px-3 py-6 text-center text-[11px] text-zinc-600">
                      Empty
                    </div>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
