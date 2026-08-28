export const ROLES = ["FOUNDER", "INVESTOR", "FIRM_ADMIN"] as const;
export type Role = (typeof ROLES)[number];

export const ROUNDS = ["PRE_SEED", "SEED", "SERIES_A"] as const;
export type Round = (typeof ROUNDS)[number];

export const CURRENCIES = ["USD", "NGN"] as const;
export type Currency = (typeof CURRENCIES)[number];

export const INSTRUMENTS = ["SAFE", "EQUITY", "CONVERTIBLE"] as const;
export type Instrument = (typeof INSTRUMENTS)[number];

export const RAISE_STATUSES = ["DRAFT", "ACTIVE", "CLOSED"] as const;
export type RaiseStatus = (typeof RAISE_STATUSES)[number];

export const PIPELINE_STAGES = [
  "INTRO",
  "MEETING",
  "DD",
  "TERM_SHEET",
  "COMMITTED",
  "PASSED",
] as const;
export type PipelineStage = (typeof PIPELINE_STAGES)[number];

export const COMMITMENT_TYPES = ["SOFT", "SIGNED"] as const;
export type CommitmentType = (typeof COMMITMENT_TYPES)[number];

export const INVESTOR_INTENTS = [
  "NONE",
  "INTERESTED",
  "MEETING_REQUESTED",
  "PASSED",
] as const;
export type InvestorIntent = (typeof INVESTOR_INTENTS)[number];

export const ROUND_LABELS: Record<string, string> = {
  PRE_SEED: "Pre-seed",
  SEED: "Seed",
  SERIES_A: "Series A",
};

export const STAGE_LABELS: Record<string, string> = {
  INTRO: "Intro",
  MEETING: "Meeting",
  DD: "Due diligence",
  TERM_SHEET: "Term sheet",
  COMMITTED: "Committed",
  PASSED: "Passed",
};

export const STAGE_COLORS: Record<string, string> = {
  INTRO: "bg-zinc-500/15 text-zinc-300 ring-zinc-500/30",
  MEETING: "bg-sky-500/15 text-sky-300 ring-sky-500/30",
  DD: "bg-amber-500/15 text-amber-300 ring-amber-500/30",
  TERM_SHEET: "bg-violet-500/15 text-violet-300 ring-violet-500/30",
  COMMITTED: "bg-emerald-500/15 text-emerald-300 ring-emerald-500/30",
  PASSED: "bg-rose-500/15 text-rose-300 ring-rose-500/30",
};

export const INTENT_LABELS: Record<string, string> = {
  NONE: "No signal",
  INTERESTED: "Interested",
  MEETING_REQUESTED: "Meeting requested",
  PASSED: "Passed",
};

export const INSTRUMENT_LABELS: Record<string, string> = {
  SAFE: "SAFE",
  EQUITY: "Equity",
  CONVERTIBLE: "Convertible note",
};

export const COOKIE_NAME = "rd_session";
export const SESSION_DAYS = 14;
