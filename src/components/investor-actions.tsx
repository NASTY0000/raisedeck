"use client";

import { investorSignalAction } from "@/lib/actions";
import { useState } from "react";

export function InvestorActions({
  raiseId,
  current,
}: {
  raiseId: string;
  current: string;
}) {
  const [pending, setPending] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function signal(intent: "INTERESTED" | "MEETING_REQUESTED" | "PASSED") {
    setPending(intent);
    setError(null);
    const result = await investorSignalAction(raiseId, intent);
    setPending(null);
    if (result && "error" in result && result.error) setError(result.error);
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          disabled={pending !== null}
          onClick={() => signal("INTERESTED")}
          className={current === "INTERESTED" ? "rd-btn-primary" : "rd-btn-ghost"}
        >
          {pending === "INTERESTED" ? "…" : "Mark interested"}
        </button>
        <button
          type="button"
          disabled={pending !== null}
          onClick={() => signal("MEETING_REQUESTED")}
          className={current === "MEETING_REQUESTED" ? "rd-btn-primary" : "rd-btn-ghost"}
        >
          {pending === "MEETING_REQUESTED" ? "…" : "Request meeting"}
        </button>
        <button
          type="button"
          disabled={pending !== null}
          onClick={() => signal("PASSED")}
          className="rd-btn-danger"
        >
          {pending === "PASSED" ? "…" : "Pass"}
        </button>
      </div>
      {error ? <p className="text-sm text-rose-400">{error}</p> : null}
    </div>
  );
}
