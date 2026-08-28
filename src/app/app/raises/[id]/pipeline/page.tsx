import { requireRole } from "@/lib/auth";
import { getRaiseForFounder } from "@/lib/access";
import { prisma } from "@/lib/prisma";
import { PIPELINE_STAGES, STAGE_LABELS } from "@/lib/constants";
import { StageBadge } from "@/components/ui";
import { updatePipelineAction } from "@/lib/actions";
import { INTENT_LABELS } from "@/lib/constants";

export default async function PipelinePage({ params }: { params: { id: string } }) {
  const user = await requireRole("FOUNDER");
  await getRaiseForFounder(params.id, user.id);
  const entries = await prisma.pipelineEntry.findMany({
    where: { raiseId: params.id },
    include: {
      investor: {
        include: { investorProfile: true },
      },
    },
    orderBy: { updatedAt: "desc" },
  });

  return (
    <div>
      <p className="mb-4 text-sm text-zinc-400">
        Drag is overkill. Move stages, set next action, keep notes. {entries.length} investors.
      </p>
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
                {col.map((entry) => (
                  <article key={entry.id} className="rd-card p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-medium">{entry.investor.name}</p>
                        <p className="text-[11px] text-zinc-500">
                          {entry.investor.investorProfile?.firmName ?? entry.investor.email}
                        </p>
                      </div>
                      <StageBadge stage={entry.stage} />
                    </div>
                    {entry.investorIntent !== "NONE" ? (
                      <p className="mt-1 text-[11px] text-accent-300">
                        {INTENT_LABELS[entry.investorIntent]}
                      </p>
                    ) : null}
                    <form action={updatePipelineAction.bind(null, entry.id)} className="mt-3 space-y-2">
                      <select name="stage" defaultValue={entry.stage} className="rd-input py-1 text-xs">
                        {PIPELINE_STAGES.map((s) => (
                          <option key={s} value={s}>
                            {STAGE_LABELS[s]}
                          </option>
                        ))}
                      </select>
                      <input
                        name="nextAction"
                        defaultValue={entry.nextAction ?? ""}
                        placeholder="Next action"
                        className="rd-input py-1 text-xs"
                      />
                      <input
                        name="introSource"
                        defaultValue={entry.introSource}
                        placeholder="Intro source"
                        className="rd-input py-1 text-xs"
                      />
                      <textarea
                        name="notes"
                        defaultValue={entry.notes}
                        rows={2}
                        placeholder="Notes"
                        className="rd-input py-1 text-xs"
                      />
                      <button type="submit" className="text-[11px] text-accent-300">
                        Save
                      </button>
                    </form>
                  </article>
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
    </div>
  );
}
