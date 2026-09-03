# WQIS Level 2 Access & AI Quota — Design Note

**Status:** Proposal. Nothing here is built yet.
**Prepared by:** DAPS Analytics
**Trigger:** UDC published a WRRI page advertising "Level 2 — Authorized Researcher
Access: researcher login, advanced analytical tools, restricted datasets" with a
**Request Researcher Access** button. That tier does not exist.

---

## 1. What actually protects the platform today

Measured against the code, not assumed.

| Surface | Spends AI tokens | Protection today | Identity? |
|---|---|---|---|
| `/api/chat` (Gemini 2.5 Flash) | Yes | Same-origin check + **5/min per IP** burst | No |
| `/api/wqis/analyze` (Gemini) | Yes | **10/min per IP** (added with the embed) | No |
| `/api/wqis/report` (Gemini) | Yes — heaviest call | **3/min per IP** (added with the embed) | No |
| `/api/wqis/insights` | No — DB query, 5-min cache | Inherits 100/min per IP | n/a |
| `/api/admin/*` | No | `ADMIN_API_KEY` shared bearer token | No |
| `/api/export`, `/api/measurements`, `/api/stations` | No | 100/min per IP | No |

**One correction to the assumption.** The admin dashboard is *not* currently
ungated — every `/api/admin/*` route checks `ADMIN_API_KEY` server-side and
returns 503 in production if it is unset. The weakness is different and worth
naming precisely: it is **one shared secret for every faculty member**. There is
no record of who uploaded what, and revoking one person's access means rotating
the key for everybody. Level 2 should *replace* that key, not add a missing gate.

**No daily cap exists anywhere.** Every limit above is per-minute burst only.

---

## 2. Why today's mechanism cannot express the WRRI policy

The policy as described — *a set number of queries per student per class, and
effectively unlimited for WRRI-approved researchers* — is not a tuning change.
It is structurally unimplementable on what exists, for three reasons:

1. **The limit key is an IP address, not a person.** A UDC lecture hall behind
   campus NAT is a *single bucket*: thirty students would share one student's
   allowance. Meanwhile a student on cellular data resets their bucket by
   toggling airplane mode. "Queries per student" cannot be built on IP.

2. **The counter lives in process memory.** It resets on every deploy, restart
   and scale event, and is not shared between replicas. This is not theoretical:
   the Container App scales to `maxReplicas=3`, and a production check showed
   concurrent report requests being served by different replicas, each with its
   own counter — so a limit of 3/min is really up to 9/min. A *daily* quota has
   to survive all of this, so it must live in Postgres.

3. **There is no user.** No accounts, no roles, no sessions, no approval record.
   "Approved by WRRI" needs something to attach the approval to.

So Level 2 = **identity + durable quota**. The per-IP limits now in place are a
spend ceiling against anonymous abuse — worth having, but not the policy.

---

## 3. Proposed model

### Roles

| Role | How they get it | Data access | AI budget |
|---|---|---|---|
| **Public (Level 1)** | No account | Dashboard, map, exports, all public data | Off in the embed; small shared allowance on the main site |
| **Student** | UDC identity + class code issued by WRRI | Level 1 + class datasets | Per-day quota, set per class |
| **Researcher (Level 2)** | UDC identity + **WRRI approval** | Level 1 + restricted datasets, downloads | High daily cap |
| **Faculty / Admin** | WRRI grant | Everything + ingestion, upload, CRUD | High daily cap |

### On "unlimited" for researchers

I would push back on literally unlimited, and this is the one place I would
argue the point. An uncapped AI endpoint attached to an account is an uncapped
invoice — one runaway script or one loop in a notebook, and there is no ceiling
and no alert. Recommend **"no practical ceiling"** instead: a daily cap high
enough that no honest researcher ever meets it (say 200 report-equivalents), which
still stops a bug from spending the grant. Functionally unlimited, financially
bounded.

### Quota in units, not requests

The three AI calls do not cost remotely the same — a 90-day report summarises far
more data than one chat turn. Counting all three as "one query" would let a
student burn the budget on reports. Suggest weighting:

| Call | Units |
|---|---|
| `/api/chat` turn | 1 |
| `/api/wqis/analyze` | 3 |
| `/api/wqis/report` | 10 |

Then a class allowance is "N units/day" and the policy survives new AI features
without renegotiation.

---

## 4. Where the code changes land

The groundwork is already in place: **all AI spend now funnels through one
function**, so quota logic has a single home rather than three.

| # | Change | File |
|---|---|---|
| 1 | Add `users`, `ai_usage`, `access_requests` tables (dual SQLite/PG, as elsewhere) | `src/lib/db.ts` |
| 2 | Session + role resolution | `src/lib/auth/` *(new)* |
| 3 | Resolve identity, then charge units against a durable daily quota; fall back to per-IP for anonymous | `src/lib/ai-rate-limit.ts` *(extend `enforceAiRateLimit`)* |
| 4 | Route `/api/chat` through the same guard | `src/app/api/chat/route.ts` |
| 5 | Swap `checkAuth` from shared bearer to session + role | `src/app/api/admin/*/route.ts` |
| 6 | Back the published "Request Researcher Access" button | `src/app/api/access-requests/` *(new)* |
| 7 | Session login instead of a pasted key | `src/app/admin/page.tsx` |

Steps 3 and 4 are the whole quota system. Steps 5 and 7 retire `ADMIN_API_KEY`.

---

## 5. The identity decision — needs UDC IT

This is the fork in the road, and it is UDC's call, not ours.

**Option A — UDC SSO (Entra ID / Shibboleth, OIDC).**
Students and researchers sign in with their existing UDC credentials. "Is this a
current UDC student?" is answered by UDC, not by us. We never store a password.
Class rosters can potentially map to groups. Requires UDC IT to register an
application and release attributes. *Recommended.* UDC already runs on Azure, so
Entra ID is the likely path.

**Option B — Local accounts with a WRRI approval queue.**
We own the user table; WRRI approves each researcher by hand. No dependency on
UDC IT, faster to stand up, but we become responsible for credential storage and
WRRI carries the manual approval load forever.

**Recommendation:** A, with B as an interim for the initial handful of
researchers if UDC IT registration takes time. B's data model is a subset of A's,
so starting with B does not throw work away.

---

## 6. What to do about the button that is already published

The staging page carries a live **Request Researcher Access** button today. It
needs a destination before go-live, and it does not need auth to be honest:

Point it at a **request form** that writes to `access_requests` and notifies
WRRI. That is accurate — it *is* a request, not a login — it needs none of the
above, and the table it writes to becomes the approval queue when Level 2 lands.
Roughly a day of work, and it unblocks UDC's page.

---

## 7. Sequencing

| Phase | Work | Blocked on |
|---|---|---|
| **13a** | Access-request form + WRRI notification | Nothing — can start now |
| **13b** | Identity decision, app registration | **UDC IT** |
| **13c** | `users` / `ai_usage` tables, durable unit quota at the single choke point | 13b |
| **13d** | Retire `ADMIN_API_KEY` in favour of roles | 13c |

---

## 8. Open questions for WRRI

The quota policy is not documented anywhere in this repository — it exists only
as a verbal understanding, so it needs confirming before anything is built:

1. Daily unit allowance for a **student**? (suggest 25)
2. Daily cap for an **approved researcher**? (suggest 200 — high, but not infinite)
3. Who at WRRI **approves** researcher requests, and what is the SLA?
4. Are allowances **per class** (a class code students enrol against) or flat per
   student across the platform?
5. Should **public/anonymous** users get any AI access on the main site, or is the
   assistant a signed-in feature only?
6. What actually sits behind "restricted datasets" for Level 2 — is that different
   data, or the same data with export limits lifted?
