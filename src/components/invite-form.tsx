"use client";

import { useState } from "react";
import { inviteInvestorAction } from "@/lib/actions";

export function InviteForm({ raiseId }: { raiseId: string }) {
  const [token, setToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(formData: FormData) {
    setPending(true);
    setError(null);
    const result = await inviteInvestorAction(raiseId, formData);
    setPending(false);
    if (result && "error" in result && result.error) {
      setError(result.error);
      return;
    }
    if (result && "token" in result && result.token) setToken(result.token);
  }

  const url = token
    ? `${typeof window !== "undefined" ? window.location.origin : ""}/invite/${token}`
    : null;

  return (
    <form action={onSubmit} className="space-y-3">
      <div className="grid grid-cols-2 gap-2">
        <input name="name" placeholder="Name" className="rd-input" />
        <input name="email" type="email" required placeholder="lp@firm.com" className="rd-input" />
      </div>
      <button type="submit" disabled={pending} className="rd-btn-primary">
        {pending ? "Creating link…" : "Create invite link"}
      </button>
      {error ? <p className="text-sm text-rose-400">{error}</p> : null}
      {url ? (
        <div className="rounded-lg border border-accent/20 bg-accent-500/5 p-3">
          <p className="text-[11px] uppercase tracking-wider text-accent-400">Share this privately</p>
          <p className="mt-1 break-all font-mono text-xs text-zinc-200">{url}</p>
          <button
            type="button"
            className="mt-2 text-xs text-accent-300"
            onClick={() => navigator.clipboard.writeText(url)}
          >
            Copy
          </button>
        </div>
      ) : null}
    </form>
  );
}
