import { requireRole } from "@/lib/auth";
import { getRaiseForFounder } from "@/lib/access";
import { prisma } from "@/lib/prisma";
import { publishUpdateAction } from "@/lib/actions";
import { formatDateTime } from "@/lib/utils";

export default async function UpdatesPage({ params }: { params: { id: string } }) {
  const user = await requireRole("FOUNDER");
  await getRaiseForFounder(params.id, user.id);
  const updates = await prisma.investorUpdate.findMany({
    where: { raiseId: params.id },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="grid gap-4 lg:grid-cols-5">
      <form action={publishUpdateAction.bind(null, params.id)} className="rd-card space-y-3 p-5 lg:col-span-2">
        <h2 className="text-sm font-medium">New update</h2>
        <p className="text-xs text-zinc-500">Sent to every investor on this raise&apos;s pipeline.</p>
        <input name="title" required placeholder="Title" className="rd-input" />
        <textarea name="body" required rows={8} placeholder="Traction, ask, blockers." className="rd-input" />
        <button className="rd-btn-primary">Publish</button>
      </form>
      <div className="space-y-3 lg:col-span-3">
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
    </div>
  );
}
