import { notFound } from "next/navigation";
import { requireRole } from "@/lib/auth";
import { getRaiseForFounder } from "@/lib/access";
import { RaiseTabs } from "@/components/raise-tabs";
import { ROUND_LABELS } from "@/lib/constants";
import { AccessError } from "@/lib/access";

export default async function RaiseLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { id: string };
}) {
  const user = await requireRole("FOUNDER");
  try {
    const raise = await getRaiseForFounder(params.id, user.id);
    return (
      <div>
        <div className="mb-2">
          <p className="text-[11px] uppercase tracking-[0.16em] text-zinc-500">
            {raise.company.name} · {ROUND_LABELS[raise.round] ?? raise.round}
          </p>
          <h1 className="text-2xl font-semibold tracking-tight">{raise.name}</h1>
        </div>
        <RaiseTabs raiseId={raise.id} />
        {children}
      </div>
    );
  } catch (e) {
    if (e instanceof AccessError && e.code === "NOT_FOUND") notFound();
    if (e instanceof AccessError && e.code === "FORBIDDEN") notFound();
    throw e;
  }
}
