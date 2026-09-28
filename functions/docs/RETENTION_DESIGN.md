# Contact Request Retention — Design (HLD / LLD)

**Story:** EPMCDMETST-66058 — *Contact-request retention must be consistent and configurable*
**Component:** Firebase Cloud Functions (`functions/`)
**Status:** Implemented
**Last updated:** 2026-09-25

> This file is the source text for the Architecture / HLD / LLD page in Confluence.
> Paste it into a Confluence page; it is authored to survive that conversion
> (tables, fenced code, no HTML).

---

## 1. Problem

`cleanupOldContactRequests` deletes contact requests from the Firebase Realtime
Database on a daily schedule. Before this change:

- the file header stated records older than **90 days** are deleted, while the
  code used `const CONTACT_REQUEST_RETENTION_DAYS = 14` — so records were
  destroyed **76 days earlier than documented**;
- the value was a source-code constant, so changing retention required a code
  change and a review cycle;
- the effective value was never logged, so an operator reading the logs could not
  tell what retention had actually been applied;
- behaviour for a record sitting *exactly* on the cutoff was an accident of the
  comparison operator, documented nowhere.

The failure mode is silent and irreversible: there is no recovery path for a
contact request that was deleted too early.

## 2. Goals and non-goals

**Goals**

| # | Goal | Acceptance criterion |
|---|---|---|
| G1 | Delete only records older than the effective retention period | AC1 |
| G2 | A documented default, and the effective value logged on every run | AC2 |
| G3 | Records newer than the cutoff are never deleted | AC3 |
| G4 | Behaviour exactly at the cutoff is explicit in code and documented | AC4 |
| G5 | Retention is configurable per environment without a code change | Story assumption |
| G6 | A misconfiguration cannot escalate into mass deletion | Derived — see §6 |

**Non-goals**

- Changing retention for any other collection. `cleanupExpiredPosts` has the same
  hard-coded-configuration shape and could follow the same pattern later; it is
  untouched here.
- Soft deletion, archival, or an undo path. Deletion remains permanent; recovery
  is a database restore.
- Per-record or per-tenant retention. One period applies to the whole collection.
- UI. This is a server-side scheduled function; no Playwright coverage applies.

## 3. High-level design

```
                          deploy time                      run time (03:30 UTC daily)
  ┌────────────────────────────────┐        ┌──────────────────────────────────────────┐
  │ functions/.env.<projectId>     │        │ cleanupOldContactRequests (onSchedule)   │
  │  CONTACT_REQUEST_RETENTION_    │        │                                          │
  │  DAYS=90                       │        │  resolveEffectiveRetention()             │
  └───────────────┬────────────────┘        │        │                                 │
                  │ firebase deploy         │        ▼                                 │
                  │ (CLI resolves params)   │  runContactRequestCleanup()              │
                  ▼                         │        │                                 │
  ┌────────────────────────────────┐        │        ├─ computeCutoff()                │
  │ deployed function environment  │───────▶│        ├─ RTDB query (endAt, limitToFirst)│
  │  CONTACT_REQUEST_RETENTION_    │        │        ├─ selectExpiredKeys()            │
  │  DAYS=90                       │        │        └─ update({key: null, …})         │
  └────────────────────────────────┘        └──────────────────────────────────────────┘
                                                        │
                                                        ▼
                                             Cloud Logging (structured)
                                             retentionDays, retentionSource,
                                             cutoff*, total{Inspected,Deleted,Preserved}
```

### Module split

| File | Responsibility | Firebase dependencies |
|---|---|---|
| `functions/index.js` | Wiring only: declares the param, resolves it, injects `db`/`logger`/`now` into the handler | Yes |
| `functions/lib/retention.js` | All retention logic: validation, cutoff maths, boundary rule, query, logging contract | **No** |

`lib/retention.js` deliberately imports nothing from `firebase-functions` or
`firebase-admin`. That is what makes the behaviour unit-testable without the
emulator, and it is why the tests exercise the code that actually ships rather
than a re-implementation of it (the previous attempt's tests re-implemented the
arithmetic inline and passed against the buggy 14-day code).

## 4. Configuration mechanism

Retention is a **Firebase Functions param**, declared in `functions/index.js`:

```js
const contactRequestRetentionDays = defineInt("CONTACT_REQUEST_RETENTION_DAYS", {
  default: DEFAULT_CONTACT_REQUEST_RETENTION_DAYS,     // 90, from lib/retention.js
  description:
    `Days to retain contact requests before deletion ` +
    `(${MIN_RETENTION_DAYS}-${MAX_RETENTION_DAYS}, default ${DEFAULT_CONTACT_REQUEST_RETENTION_DAYS})`,
});
```

The declared default is the **exported constant**, not a literal. This is the
specific defence against the original defect: the documented default and the
deployed default are the same symbol, so they cannot drift.

Params are backed by dotenv files:

| File | Scope | Committed |
|---|---|---|
| `functions/.env` | Local development and the emulator | No — gitignored |
| `functions/.env.<projectId>` | One Firebase project; written by the deploy scripts | No — gitignored |
| `functions/.env.example` | Template and documentation | Yes |

### Two facts that shaped this design

1. **`firebase deploy` has no `--set-env-vars` flag.** That is a `gcloud` flag.
   An earlier revision of the deploy scripts and docs used it; those deploys
   would have failed outright. `firebase functions:config:get` is likewise the
   *deprecated legacy* config API and is unrelated to params.
2. **Params are resolved at deploy time.** The CLI reads the dotenv file, applies
   the declared default where the file is silent, and bakes the result into the
   deployed function's environment. Changing retention therefore **always
   requires a redeploy**; editing the environment variable in the Cloud console
   does not survive the next deploy.

### Measured runtime behaviour of `defineInt`

Verified against `firebase-functions` v7:

| Backing environment variable | `.value()` returns |
|---|---|
| absent | `0` — **not** the declared default |
| `"30"` | `30` |
| `"abc"` | `0` |
| `"30.5"` | `30` |
| `"0"` | `0` |
| `"-5"` | `-5` |

`.value()` never throws. The first row is the dangerous one: a bare
`contactRequestRetentionDays.value()` yields `0` on any deployment where the
variable is missing, and a retention of `0` puts the cutoff at "now" — every
contact request becomes eligible for deletion. The declared default is applied
by the CLI, not by the accessor.

`resolveEffectiveRetention` exists precisely to close this gap. It inspects the
raw environment string *as well as* the param value, so it can distinguish three
cases the accessor collapses into `0`:

| Raw `process.env` value | Classification | Effective retention | Warning |
|---|---|---|---|
| absent / `""` / whitespace | not configured | 90 (default) | none — absence is not an error |
| `"0"` | configured, invalid | 90 (default) | yes |
| `"abc"` | configured, invalid | 90 (default) | yes, quoting the value |

## 5. Low-level design

### Constants — `functions/lib/retention.js`

| Constant | Value | Note |
|---|---|---|
| `MILLISECONDS_PER_DAY` | `86400000` | |
| `DEFAULT_CONTACT_REQUEST_RETENTION_DAYS` | `90` | The documented default (AC2) |
| `MIN_RETENTION_DAYS` | `1` | |
| `MAX_RETENTION_DAYS` | `3650` | 10 years — an upper sanity bound |
| `BATCH_SIZE` | `200` | Records per scheduled run |

### Functions

| Function | Signature | Purpose |
|---|---|---|
| `resolveRetentionDays` | `(raw) → {retentionDays, source, warning?}` | Validates one candidate value |
| `resolveEffectiveRetention` | `({envValue, paramValue}) → {retentionDays, source, warning?}` | Reconciles the raw env string with the param accessor (see §4) |
| `computeCutoff` | `(nowMs, retentionDays) → number` | `nowMs - retentionDays × 86400000` |
| `selectExpiredKeys` | `(entries, cutoff) → {updates, totalInspected, totalDeleted, totalPreserved}` | Applies the boundary rule |
| `runContactRequestCleanup` | `({db, logger, retentionDays, now, retentionSource}) → counts` | The handler body, with dependencies injected |

`source` is `"configured"` or `"default"` and is surfaced in the logs as
`retentionSource`, so an operator can tell whether a deployed value took effect.

### Validation rules — `resolveRetentionDays`

Accepts a value only if it is an integer in `[1, 3650]`. Coercion is deliberately
narrow — numbers and strings only, so `true`, `{}` and `[]` are rejected rather
than silently becoming `1` or `0`:

```js
const parsed = typeof raw === "number" ? raw : typeof raw === "string" ? Number(raw) : NaN;
```

| Input | Result | Rationale |
|---|---|---|
| `undefined`, `null`, `""` | default, `source: "default"`, no warning | Nothing was configured |
| `30`, `"60"` | configured | Valid |
| `0` | default + warning | Cutoff would be "now" → deletes everything (G6) |
| `-5` | default + warning | Cutoff would be in the future |
| `1.5`, `"30.5"` | default + warning | Whole days only; truncation would surprise |
| `"abc"`, `NaN`, `Infinity` | default + warning | Not a number |
| `3651` | default + warning | Above `MAX_RETENTION_DAYS` |
| `true`, `{}` | default + warning | Not a retention value |

Every rejection **falls back to the safe 90-day default and logs a warning** —
the function never throws and never skips its run over a bad config. A skipped
run is a silent unbounded data-growth bug; a fallback run with a warning is
visible and bounded.

### Query

```js
db.ref("contactRequests")
  .orderByChild("createdAt")
  .endAt(cutoff)
  .limitToFirst(BATCH_SIZE)
```

- `endAt` is **inclusive**, so a record exactly on the boundary *is* fetched. It
  is then preserved by `selectExpiredKeys`. The boundary rule lives in exactly
  one place rather than being split between the query and the loop — which is
  what makes AC4 verifiable.
- `limitToFirst(BATCH_SIZE)` bounds memory and execution time. A backlog drains
  over successive daily runs; the run warns when the window is saturated.
- RTDB sorts children lacking the ordered key **first**, so records with no
  `createdAt` always fall inside the window and do reach the function.
- The query needs an index on `createdAt` under `contactRequests`, or RTDB falls
  back to a full-collection scan. This is already in place —
  `database.rules.json:138` declares `".indexOn": ["donorUid", "requesterUid",
  "createdAt"]` — and must stay there.

### Boundary rule — `selectExpiredKeys`

```js
const createdAt =
  typeof entry.createdAt === "number" && Number.isFinite(entry.createdAt)
    ? entry.createdAt
    : 0;   // missing/invalid createdAt → treated as infinitely old → deleted

if (createdAt < cutoff) {
  updates[entry.key] = null;   // RTDB deletes a child by setting it to null
  totalDeleted++;
}
```

| `createdAt` | Decision | Reason |
|---|---|---|
| `< cutoff` | **DELETE** | Older than the retention period (AC1) |
| `== cutoff` | **KEEP** | Retention is "keep for N days"; the record has completed exactly N days and has not yet exceeded them. Strict `<` also makes the rule stable under repeated runs (AC4) |
| `> cutoff` | KEEP | Within retention (AC3) |
| missing / `null` / non-numeric / `NaN` / `Infinity` | **DELETE** | Coerced to `0` → infinitely old. Such records are malformed and would otherwise accumulate forever with no path to removal |

The `== cutoff → keep` choice is the conservative one: at millisecond resolution
the practical difference is one record for one millisecond, and if the rule must
err it should err toward *retaining* data, since deletion is irreversible.

In practice such records should be rare: `database.rules.json` validates that
every `contactRequests/$requestId` has `createdAt`, so a record without one can
only arrive through a privileged write — the Admin SDK, a console edit, or a data
import — which is exactly the kind of accident that leaves untracked records
behind.

The missing-`createdAt` choice is the opposite direction and deliberately so: a
record with no timestamp can never age out under a "keep for N days" rule, so
preserving it would mean an unbounded, permanently ungovernable subset of the
collection. This is the one decision in the design that trades data away for
governability; it is called out in the runbook because it can inflate
`totalDeleted` after a data-format change.

### Writes

`update()` is called **only when `totalDeleted > 0`** — one atomic multi-path
update per run, never an empty write.

## 6. Safety analysis

| Risk | Mitigation |
|---|---|
| Retention misconfigured to `0` → everything deleted | Rejected by validation; default used; warning logged |
| Variable absent, `defineInt` yields `0` → everything deleted | `resolveEffectiveRetention` treats absence as "not configured" and uses the default without a warning |
| Retention silently reduced | `retentionDays` and `retentionSource` logged on every run; deploy scripts back up the previous `.env.<projectId>` |
| Comment/code drift recurring | The default is one exported constant; a test greps `index.js` and fails if a numeric literal reappears |
| Unbounded run on a large backlog | `limitToFirst(200)`, plus a warning when the window is saturated |
| Boundary regression (`<` → `<=`) | Dedicated tests; flipping the operator fails 6 of them |

## 7. Logging contract

All entries are structured; field names are exactly as logged.

| Entry | Level | Fields |
|---|---|---|
| `cleanupOldContactRequests: invalid retention configuration` | warn | `warning` |
| `cleanupOldContactRequests: starting` | info | `retentionDays`, `retentionSource`, `cutoffTimestamp`, `cutoffDate`, `currentTimestamp`, `currentDate`, `batchSize` |
| `cleanupOldContactRequests: nothing to clean up` | info | `retentionDays`, `cutoffTimestamp`, `totalInspected`, `totalDeleted`, `totalPreserved` |
| `cleanupOldContactRequests: completed` | info | `retentionDays`, `retentionSource`, `totalInspected`, `totalDeleted`, `totalPreserved`, `cutoffTimestamp`, `cutoffDate` |
| `cleanupOldContactRequests: batch limit reached — more old requests may remain` | warn | `batchSize`, `retentionDays`, `totalInspected` |

Every run emits `starting`, then either `completed` or `nothing to clean up`.
The `nothing to clean up` early return carries a smaller payload because nothing
was inspected. The batch warning keys off `totalInspected`, not `totalDeleted`:
a full window of *preserved* records also means eligible records may sit beyond
it.

`retentionDays` + `retentionSource` on every run is what satisfies AC2 and what
the runbook tells operators to check after any retention change.

## 8. Test strategy

| Layer | File | What it proves |
|---|---|---|
| Gherkin specification | `functions/test/features/contactRequestRetention.feature` | The readable contract: configuration, boundary, logging, batching |
| Unit — pure logic | `functions/test/retention.test.js` | Default is 90; validation table; cutoff maths; the four boundary cases; invalid `createdAt`; mixed-age set |
| Unit — handler | `functions/test/cleanupOldContactRequests.test.js` | Query shape, the exact `update()` payload, no write when nothing is eligible, the log payloads, the batch warning |
| Entrypoint smoke | CI step | `require("./index.js")` loads — the unit tests do not import the deployed file |

There is no Cucumber runner in this project; the `.feature` file is the readable
contract and the two mocha suites are the enforcement.

**Mutation checks** (run to prove the tests have teeth, then reverted):

| Mutation | Result |
|---|---|
| `DEFAULT_CONTACT_REQUEST_RETENTION_DAYS` `90` → `14` | 1 failure |
| Boundary `createdAt < cutoff` → `<=` | 6 failures across both suites |

Current state: **41 passing**.

Emulator verification is a manual step (it needs the Firebase CLI and a JVM); the
exact commands are in `functions/OPERATIONS_RUNBOOK.md` § *Local verification
with the emulator*.

## 9. Operational notes

- **Schedule:** `every day 03:30` UTC, `retryCount: 1`, `memory: 256MiB`.
- **Changing retention:** edit `functions/.env.<projectId>` (or use
  `functions/scripts/deploy.sh <env>`) and **redeploy**. Confirm the change in the
  next run's `starting` log: `retentionSource: "configured"` and the expected
  `retentionDays`. A `"default"` source means the param never reached the
  function.
- **Reducing retention** makes everything between the new and old period eligible
  at once; expect an elevated `totalDeleted` and possibly several days of batch
  warnings while the backlog drains.
- **Environment presets** used by the deploy scripts: dev 30, staging 60,
  production 90.
- **Recovery:** none. Deletion is permanent; restore from a database backup.

## 10. Alternatives considered

| Alternative | Why not |
|---|---|
| Keep the constant, just fix it to 90 | Satisfies AC1/AC3/AC4 but not G5 — every retention change stays a code change and a deploy cycle |
| `functions.config()` (legacy) | Deprecated; superseded by params |
| Store retention in the RTDB and read it per run | Adds a read and a failure mode to every run, and makes the value mutable without review or audit trail. Deploy-time config is the right granularity for a policy value |
| Secret Manager | Retention is not a secret; adds cost and access management for nothing |
| `createdAt == cutoff` → delete | Equally defensible, but deletion is irreversible, so the tie breaks toward retention |
| Preserve records with a missing `createdAt` | They could never age out — an unbounded ungovernable subset (see §5) |
| Delete the whole backlog in one run | Unbounded memory and runtime; batching with a visible warning is safer |

## 11. References

- Runbook: `functions/OPERATIONS_RUNBOOK.md`
- Deploy scripts: `functions/scripts/README.md`
- Configuration template: `functions/.env.example`
- Project README, retention section: `README.md`
- Implementation: `functions/lib/retention.js`, `functions/index.js`
- Firebase: *Configure your environment* — parameterized configuration and
  dotenv files for Cloud Functions
