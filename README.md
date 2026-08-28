# RaiseDeck

Fundraising and VC dealflow in one workspace. Founders run a round (deck, data room, pipeline, updates). Investors only see deals they were invited to.

This is an MVP: no cap table, no banking, no public startup social network.

## Stack

Next.js 14 App Router, TypeScript, Tailwind CSS, Prisma, SQLite.

## Run

From `/workspace/raisedeck`:

1. `npm install`
2. `npm run dev`

App listens on http://localhost:3003

`npm run dev` generates the Prisma client, pushes the SQLite schema, and seeds demo data (idempotent) before starting the server.

- `npm test` — isolation, invites, commitments, role gates
- `npm run db:reset` — wipe SQLite and reseed

SQLite file: `prisma/dev.db`. Uploads: `uploads/`. Env: `.env` (`DATABASE_URL`, `SESSION_SECRET`).

## Demo logins

Password for every demo account: `demo1234`

| Role     | Email                   | What you see                                      |
|----------|-------------------------|---------------------------------------------------|
| Founder  | ada@raisedeck.demo      | NaijaPay · Seed 2026 · pipeline + data room       |
| Founder  | bola@raisedeck.demo     | Harvest AI · used for isolation tests             |
| Investor | amara@raisedeck.demo    | NaijaPay at **Meeting** · General folder only     |
| Investor | chidi@raisedeck.demo    | NaijaPay at **DD** · General + Financials + Legal |
| Investor | kemi@raisedeck.demo     | Harvest AI only — cannot see NaijaPay             |

Invite link (register as `newlp@raisedeck.demo`):

http://localhost:3003/invite/demo-invite-naijapay-seed

## Happy path

1. Sign in as Ada. Overview shows Seed 2026 fill from signed commitments.
2. **New raise** from Raises — create a pre-seed / seed / Series A in USD or NGN (SAFE, equity, or convertible).
3. Open the raise → **Invite an investor** → copy the tokenized link.
4. Sign out, open the invite, create an investor account with that email.
5. Investor opens the deal, views the pitch deck, **Mark interested**.
6. Sign back in as Ada. Pipeline shows the signal. **Record commitment** as Signed. The progress bar updates (percent filled = signed / target). Soft circles are tracked separately and do not count as filled.

## What works

- Auth with founder vs investor (cookie sessions, scrypt password hashes)
- Raises: round, target, USD/NGN, instrument, status, valuation / cap, percent filled
- Pipeline CRM: intro → meeting → DD → term sheet → committed → passed; next action, notes, intro source
- Commitments: soft vs signed; signed amounts drive the progress bar
- Data room: folders, local uploads, per-investor folder grants; pitch deck flagged for all invitees
- Investor updates from the founder
- Tokenized invite links bound to an email
- Investor dealflow board (invited deals only) with pass / request meeting / mark interest
- Activity timeline on raise and deal pages
- Dark mode (default) with a light-mode toggle
- Optional firm membership on Amara (Sahel Ventures) — partners share a firm record, not a public network

## Tests

`npm test` covers:

- Investor A cannot see founder B's data room (or ungated financials on a deal they are on)
- Invite create + redeem; founders cannot redeem; email must match
- Recording a signed commitment increases fill percent; soft circles do not
- Role gates: founder vs investor app, uninvited raise access, demo password verify

## Gaps (intentionally out of scope)

- Full cap table, e-sign, bank wiring, SPVs
- Email delivery (invites are links you copy)
- Multi-file preview besides download/inline
- Real-time collab or a public startup directory
