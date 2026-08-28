"use client";

import { useState } from "react";
import { addCommitmentAction } from "@/lib/actions";

export function CommitmentForm({
  raiseId,
  investors,
}: {
  raiseId: string;
  investors: { id: string; name: string }[];
}) {
  const [msg, setMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(formData: FormData) {
    setError(null);
    setMsg(null);
    const result = await addCommitmentAction(raiseId, formData);
    if (result && "error" in result && result.error) {
      setError(result.error);
      return;
    }
    if (result && "filledPercent" in result) {
      setMsg(`Recorded. Round is now ${result.filledPercent}% signed.`);
    }
  }

  if (!investors.length) {
    return <p className="text-sm text-zinc-500">Invite an investor before recording a commitment.</p>;
  }

  return (
    <form action={onSubmit} className="space-y-3">
      <select name="investorId" className="rd-input" required>
        {investors.map((i) => (
          <option key={i.id} value={i.id}>
            {i.name}
          </option>
        ))}
      </select>
      <div className="grid grid-cols-2 gap-2">
        <input name="amount" type="number" min="1" required placeholder="Amount" className="rd-input" />
        <select name="type" className="rd-input" defaultValue="SOFT">
          <option value="SOFT">Soft circle</option>
          <option value="SIGNED">Signed</option>
        </select>
      </div>
      <button type="submit" className="rd-btn-primary">
        Record commitment
      </button>
      {error ? <p className="text-sm text-rose-400">{error}</p> : null}
      {msg ? <p className="text-sm text-accent-300">{msg}</p> : null}
    </form>
  );
}
