import { relativeTime } from "@/lib/utils";

export type ActivityItem = {
  id: string;
  type: string;
  message: string;
  createdAt: Date;
  actor: { name: string };
};

const DOT: Record<string, string> = {
  RAISE_CREATED: "bg-accent-400",
  INVESTOR_INVITED: "bg-sky-400",
  INVITE_REDEEMED: "bg-sky-300",
  STAGE_CHANGED: "bg-violet-400",
  COMMITMENT_ADDED: "bg-emerald-400",
  FILE_UPLOADED: "bg-zinc-400",
  UPDATE_PUBLISHED: "bg-amber-400",
  INTEREST_MARKED: "bg-teal-400",
  MEETING_REQUESTED: "bg-indigo-400",
  PASSED: "bg-rose-400",
};

export function ActivityFeed({ items }: { items: ActivityItem[] }) {
  if (!items.length) {
    return <p className="text-sm text-zinc-500">No activity yet.</p>;
  }
  return (
    <ol className="relative space-y-0 border-l border-white/10 pl-4">
      {items.map((item) => (
        <li key={item.id} className="relative pb-5 last:pb-0">
          <span
            className={`absolute -left-[21px] top-1.5 h-2.5 w-2.5 rounded-full ${DOT[item.type] ?? "bg-zinc-500"}`}
          />
          <p className="text-sm text-zinc-200">{item.message}</p>
          <p className="mt-0.5 text-[11px] text-zinc-500">
            {item.actor.name} · {relativeTime(item.createdAt)}
          </p>
        </li>
      ))}
    </ol>
  );
}
