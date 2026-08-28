import { STAGE_COLORS, STAGE_LABELS } from "@/lib/constants";
import { cn } from "@/lib/utils";

export function Badge({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md px-1.5 py-0.5 text-[11px] font-medium ring-1 ring-inset",
        className,
      )}
    >
      {children}
    </span>
  );
}

export function StageBadge({ stage }: { stage: string }) {
  return (
    <Badge className={STAGE_COLORS[stage] ?? "bg-white/10 text-zinc-300 ring-white/10"}>
      {STAGE_LABELS[stage] ?? stage}
    </Badge>
  );
}

export function ProgressBar({
  signed,
  soft,
  className,
}: {
  signed: number;
  soft?: number;
  className?: string;
}) {
  return (
    <div className={cn("h-1.5 w-full overflow-hidden rounded-full bg-white/10", className)}>
      <div className="relative h-full w-full">
        {soft != null && (
          <div
            className="absolute inset-y-0 left-0 bg-accent-700/70"
            style={{ width: `${Math.min(100, soft)}%` }}
          />
        )}
        <div
          className="absolute inset-y-0 left-0 bg-accent-400"
          style={{ width: `${Math.min(100, signed)}%` }}
        />
      </div>
    </div>
  );
}

export function Logo({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent-400 text-accent-fg shadow-glow">
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.2">
          <path d="M4 16 L12 6 L20 16" />
          <path d="M7.5 16 L12 10.5 L16.5 16" />
        </svg>
      </span>
      <span className="text-[15px] font-semibold tracking-tight">RaiseDeck</span>
    </div>
  );
}

export function EmptyState({
  title,
  body,
  action,
}: {
  title: string;
  body: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="rd-card flex flex-col items-start gap-2 px-5 py-8">
      <p className="text-sm font-medium">{title}</p>
      <p className="max-w-md text-sm text-zinc-400">{body}</p>
      {action}
    </div>
  );
}
