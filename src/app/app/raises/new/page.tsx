"use client";

import { useFormState, useFormStatus } from "react-dom";
import { createRaiseAction } from "@/lib/actions";

function Submit() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="rd-btn-primary">
      {pending ? "Creating…" : "Create raise"}
    </button>
  );
}

export default function NewRaisePage() {
  const [state, action] = useFormState(createRaiseAction, undefined);
  return (
    <div className="max-w-xl">
      <h1 className="text-2xl font-semibold tracking-tight">New raise</h1>
      <p className="mt-1 text-sm text-zinc-400">
        Pre-seed, seed, or Series A. Target in USD or NGN. SAFE, equity, or convertible.
      </p>
      <form action={action} className="rd-card mt-6 space-y-4 p-5">
        <div>
          <label className="rd-label">Name</label>
          <input name="name" className="rd-input" placeholder="Seed 2026" required />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="rd-label">Round</label>
            <select name="round" className="rd-input" defaultValue="SEED">
              <option value="PRE_SEED">Pre-seed</option>
              <option value="SEED">Seed</option>
              <option value="SERIES_A">Series A</option>
            </select>
          </div>
          <div>
            <label className="rd-label">Instrument</label>
            <select name="instrument" className="rd-input" defaultValue="SAFE">
              <option value="SAFE">SAFE</option>
              <option value="EQUITY">Equity</option>
              <option value="CONVERTIBLE">Convertible note</option>
            </select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="rd-label">Target amount</label>
            <input name="targetAmount" type="number" min="1" className="rd-input" required />
          </div>
          <div>
            <label className="rd-label">Currency</label>
            <select name="currency" className="rd-input" defaultValue="USD">
              <option value="USD">USD</option>
              <option value="NGN">NGN</option>
            </select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="rd-label">Valuation (priced)</label>
            <input name="valuation" type="number" min="0" className="rd-input" placeholder="Optional" />
          </div>
          <div>
            <label className="rd-label">Valuation cap (SAFE)</label>
            <input name="valuationCap" type="number" min="0" className="rd-input" placeholder="Optional" />
          </div>
        </div>
        <div>
          <label className="rd-label">Status</label>
          <select name="status" className="rd-input" defaultValue="ACTIVE">
            <option value="DRAFT">Draft</option>
            <option value="ACTIVE">Active</option>
            <option value="CLOSED">Closed</option>
          </select>
        </div>
        <div>
          <label className="rd-label">Summary</label>
          <textarea name="summary" rows={4} className="rd-input" placeholder="Use of funds, cap, why now." />
        </div>
        {state?.error ? <p className="text-sm text-rose-400">{state.error}</p> : null}
        <Submit />
      </form>
    </div>
  );
}
