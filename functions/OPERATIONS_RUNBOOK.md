# Contact Request Retention - Operations Runbook

## Quick Reference

### Function: cleanupOldContactRequests

- **What**: Deletes contact requests older than the effective retention period
- **When**: Daily at 03:30 UTC (`onSchedule("30 3 * * *")`)
- **Retention**: 90 days by default, configurable via `CONTACT_REQUEST_RETENTION_DAYS`
- **Accepted range**: 1–3650 days, integers only
- **Batch Size**: 200 records per run
- **Source**: [`index.js`](index.js) (wiring) and [`lib/retention.js`](lib/retention.js) (logic)

### Cutoff rule

`cutoff = now - retentionDays × 86_400_000`

| `createdAt` | Result |
|---|---|
| `< cutoff` | **DELETE** |
| `== cutoff` | **KEEP** — a record exactly at the boundary is still within retention |
| `> cutoff` | KEEP |
| missing / `null` / non-numeric / `NaN` / `Infinity` | **DELETE** — coerced to `0`, i.e. treated as infinitely old |

The RTDB query uses `endAt(cutoff)`, which is *inclusive*, so boundary records are
fetched and then preserved by `selectExpiredKeys`. The rule lives in one place
rather than being split between the query and the loop. Records lacking
`createdAt` sort first in RTDB, so they always fall inside the window and do
reach the function.

---

## Configuration Quick Commands

Retention is a **Firebase Functions param** (`defineInt`), backed by dotenv
files. Two consequences worth internalising before touching anything:

- **`firebase deploy` has no `--set-env-vars` flag.** That is a `gcloud` flag.
  Earlier revisions of these docs used it; such a deploy fails outright.
- **`firebase functions:config:get` is the deprecated legacy config API** and has
  nothing to do with params. It will not show this value.

### View the effective configuration

The authoritative answer is the function's own log — it reports the value it
actually used, and whether that value came from configuration or the default:

```bash
firebase functions:log --only cleanupOldContactRequests | grep -E "retentionDays|retentionSource"
```

The files that supply it:

```bash
cat functions/.env                      # local / emulator
cat functions/.env.blood-point-app      # per-project deploy value
```

### Update the retention period

```bash
# Local / emulator — functions/.env (gitignored)
echo "CONTACT_REQUEST_RETENTION_DAYS=1" > functions/.env
firebase emulators:start --only functions,database

# Deployed — via the deploy script (writes functions/.env.<projectId>)
./functions/scripts/deploy.sh production --dry-run    # preview first
./functions/scripts/deploy.sh production              # dev 30 / staging 60 / production 90

# Deployed — by hand
echo "CONTACT_REQUEST_RETENTION_DAYS=45" > functions/.env.blood-point-app
firebase deploy --only functions:cleanupOldContactRequests --project blood-point-app
```

> **Param values are resolved at deploy time** and baked into the deployed
> function. Changing retention **always requires a redeploy**; editing the
> environment variable in the Google Cloud console will not survive the next
> deploy.

### Invalid values are never honoured

`0`, negative numbers, fractions and non-numeric values are rejected at runtime.
The function logs a warning and uses the 90-day default instead — a retention of
`0` would put the cutoff at "now" and delete every contact request.

---

## Monitoring Checklist

### Daily (Automated Alerts Recommended)

- [ ] Function executed at 03:30 UTC
- [ ] No errors in logs
- [ ] `retentionSource` is `"configured"` where a value was deployed
- [ ] `totalDeleted` count is reasonable
- [ ] No repeated batch limit warnings
- [ ] No `invalid retention configuration` warnings

### Weekly

- [ ] Review deletion trends
- [ ] Check for unusual patterns
- [ ] Verify retention period is correct

### Monthly

- [ ] Analyze retention metrics
- [ ] Review compliance requirements
- [ ] Update documentation if needed

---

## Log Interpretation

Every run emits a `starting` entry and then either `completed` or
`nothing to clean up`. Field names below are exactly what the code logs.

### Normal Operation

```
cleanupOldContactRequests: starting
  retentionDays: 90
  retentionSource: "configured"
  cutoffTimestamp: 1696291200000
  cutoffDate: "2023-10-03T00:00:00.000Z"
  currentTimestamp: 1704067200000
  currentDate: "2024-01-01T00:00:00.000Z"
  batchSize: 200

cleanupOldContactRequests: completed
  retentionDays: 90
  retentionSource: "configured"
  totalInspected: 45
  totalDeleted: 45
  totalPreserved: 0
  cutoffTimestamp: 1696291200000
  cutoffDate: "2023-10-03T00:00:00.000Z"
```

**Action**: ✅ No action needed - normal operation

---

### No Records to Clean

The early return carries a smaller payload (no `retentionSource`, no
`cutoffDate`) because nothing was inspected:

```
cleanupOldContactRequests: starting
  retentionDays: 90
  retentionSource: "configured"
  ...

cleanupOldContactRequests: nothing to clean up
  retentionDays: 90
  cutoffTimestamp: 1696291200000
  totalInspected: 0
  totalDeleted: 0
  totalPreserved: 0
```

**Action**: ✅ No action needed - no records older than the cutoff exist

---

### Retention came from the default

```
cleanupOldContactRequests: starting
  retentionDays: 90
  retentionSource: "default"
  ...
```

**Action**: ✅ Expected on a project where no value was deployed. ⚠️ If a value
*was* deployed, the param did not reach the function — check that
`functions/.env.<projectId>` exists for the deployed project id and redeploy.

---

### Invalid configuration

```
cleanupOldContactRequests: invalid retention configuration
  warning: "CONTACT_REQUEST_RETENTION_DAYS must be between 1 and 3650 days, got 0 — falling back to the default of 90 days"

cleanupOldContactRequests: starting
  retentionDays: 90
  retentionSource: "default"
  ...
```

**Action**: 🔍 Fix the configured value and redeploy. Data was **not** harmed —
the default was used — but the intended retention is not in effect.

---

### Batch Limit Warning (First Time)

```
cleanupOldContactRequests: completed
  retentionDays: 90
  retentionSource: "configured"
  totalInspected: 200
  totalDeleted: 200
  totalPreserved: 0
  cutoffTimestamp: 1696291200000
  cutoffDate: "2023-10-03T00:00:00.000Z"

cleanupOldContactRequests: batch limit reached — more old requests may remain
  batchSize: 200
  retentionDays: 90
  totalInspected: 200
```

**Action**: ⚠️ Monitor - backlog exists, will clear over multiple days

Note the warning keys off `totalInspected`, not `totalDeleted`. A full batch of
records that were all *preserved* also warns; that is intentional, since the
query window was saturated and eligible records may sit beyond it.

---

### Batch Limit Warning (Repeated)

If the warning appears 3+ days in a row:

**Possible Causes**:

1. Large backlog of old records
2. Retention period recently decreased (more records became eligible)
3. High volume of new contact requests

**Action**: 🔍 Investigate

1. Check total contact requests count
2. Analyze creation date distribution
3. Consider the one-time manual cleanup below if urgent
4. Verify the function is running daily

---

### Error Logs

```
Error: PERMISSION_DENIED: Permission denied
```

**Action**: ❌ Urgent

1. Check Firebase security rules
2. Verify service account permissions
3. Redeploy the function if needed

---

## Troubleshooting Guide

### Problem: Wrong retention period being used

**Symptoms**:

- Logs show an unexpected `retentionDays` value
- Records deleted too early or too late

**Solutions**:

1. Read what the function actually used:

   ```bash
   firebase functions:log --only cleanupOldContactRequests | grep -E "retentionDays|retentionSource|invalid retention"
   ```

2. Check the file that backs the param for the deployed project:

   ```bash
   cat functions/.env.blood-point-app
   ```

3. Correct it and redeploy — the value is baked in at deploy time:

   ```bash
   echo "CONTACT_REQUEST_RETENTION_DAYS=90" > functions/.env.blood-point-app
   firebase deploy --only functions:cleanupOldContactRequests --project blood-point-app
   ```

4. Verify in the next run's logs

---

### Problem: No records being deleted

**Symptoms**:

- Old contact requests still exist
- Logs show `totalDeleted: 0` but old records are expected

**Checks**:

1. Compare `cutoffDate` in the logs against the records' `createdAt`
2. Confirm `createdAt` is a **number** (epoch milliseconds). An ISO *string*
   `createdAt` is non-numeric — such records are treated as age 0 and deleted,
   not preserved, so this symptom points elsewhere
3. Records exactly at the cutoff are preserved by design
4. Confirm the function is running (check logs for daily execution)
5. Verify the database index on `createdAt` exists (`database.rules.json`)

**Solutions**:

```bash
# Inspect the data
firebase database:get /contactRequests --pretty

# Redeploy the function
firebase deploy --only functions:cleanupOldContactRequests
```

---

### Problem: Function timeout

**Symptoms**:

- Function execution exceeds the time limit
- Incomplete deletion batches

**Solutions**:

1. Check batch size (should be 200 — `BATCH_SIZE` in `lib/retention.js`)
2. Monitor memory usage
3. Confirm the `createdAt` index exists, so the query is not a full scan
4. Review database indexes

---

### Problem: Unexpected high deletion count

**Symptoms**:

- `totalDeleted` much higher than normal
- Concerns about data loss

**Checks**:

1. Read `retentionDays` and `retentionSource` from the run's `starting` log
2. Check whether `cutoffDate` matches the intended period
3. Review recent configuration changes and the deploy script backups in
   `functions/backups/`
4. Look for records with a missing or non-numeric `createdAt` — those are
   deleted by design and can inflate the count after a data-format change

**Actions**:

1. Correct the configured value and redeploy (see above)
2. Contact the team if data recovery is needed — there is **no** automatic
   recovery; restore from a database backup

---

## Common Operations

### Update Retention Period (Step-by-Step)

1. **Document current state**:

   ```bash
   cp functions/.env.blood-point-app "config-backup-$(date +%Y%m%d).env" 2>/dev/null || true
   firebase functions:log --only cleanupOldContactRequests > logs-before.txt
   ```

2. **Calculate impact**:
   - Current retention: X days
   - New retention: Y days
   - If Y < X, records between Y and X days old become eligible on the next run

3. **Deploy the change**:

   ```bash
   ./functions/scripts/deploy.sh production --dry-run
   ./functions/scripts/deploy.sh production
   ```

   or by hand:

   ```bash
   echo "CONTACT_REQUEST_RETENTION_DAYS=<new_value>" > functions/.env.blood-point-app
   firebase deploy --only functions:cleanupOldContactRequests --project blood-point-app
   ```

4. **Monitor the first run** (03:30 UTC), or trigger the Cloud Scheduler job
   manually from the Google Cloud console:

   ```bash
   firebase functions:log --only cleanupOldContactRequests
   ```

5. **Verify**:
   - `retentionDays` matches the new value
   - `retentionSource` is `"configured"`
   - `totalDeleted` is as expected, no errors logged

6. **Document the change**: team documentation, change management, stakeholders

---

### Local verification with the emulator

```bash
cd functions
npm ci

# A 1-day retention makes the boundary easy to hit with seeded data.
echo "CONTACT_REQUEST_RETENTION_DAYS=1" > .env

cd ..
firebase emulators:start --only functions,database
```

In a second terminal, seed three records around the cutoff and trigger the
function:

```bash
# cutoff = now - 1 day. Seed at cutoff-1ms, cutoff, cutoff+1ms.
node -e '
const day = 86400000, cutoff = Date.now() - day;
const seed = {
  "before-cutoff": { createdAt: cutoff - 1, name: "delete me" },
  "at-cutoff":     { createdAt: cutoff,     name: "keep me"   },
  "after-cutoff":  { createdAt: cutoff + 1, name: "keep me"   },
  "no-timestamp":  { name: "delete me too" }
};
require("fs").writeFileSync("seed.json", JSON.stringify(seed, null, 2));
'
firebase database:set /contactRequests seed.json

firebase functions:shell
# then, in the shell:
cleanupOldContactRequests()
```

Expect: `retentionDays: 1`, `retentionSource: "configured"`, `totalInspected: 4`,
`totalDeleted: 2` (`before-cutoff` and `no-timestamp`), `totalPreserved: 2`.

The same boundary cases are covered without the emulator by
`functions/test/retention.test.js`:

```bash
cd functions && npm test
```

---

### Manual Trigger (Emergency)

⚠️ **Use only in emergencies or testing**

```bash
# Local emulator
firebase functions:shell
# then, in the shell:
cleanupOldContactRequests()

# Deployed: run the Cloud Scheduler job for the function from the
# Google Cloud console (Cloud Scheduler → "Force run").
```

---

### One-Time Manual Cleanup (Large Backlog)

If batch warnings persist and urgent cleanup is needed. This script reuses the
shared retention module, so the boundary rule cannot drift from the deployed
function:

```javascript
// functions/scripts/manual-cleanup.js  (one-time; not committed)
const admin = require("firebase-admin");
const {
  DEFAULT_CONTACT_REQUEST_RETENTION_DAYS,
  resolveRetentionDays,
  computeCutoff,
  selectExpiredKeys,
} = require("../lib/retention");

admin.initializeApp();
const db = admin.database();

const { retentionDays } = resolveRetentionDays(
  process.env.CONTACT_REQUEST_RETENTION_DAYS ?? DEFAULT_CONTACT_REQUEST_RETENTION_DAYS
);
const cutoff = computeCutoff(Date.now(), retentionDays);
const LARGE_BATCH = 500;   // larger than the scheduled function's 200

async function manualCleanup() {
  let totalDeleted = 0;

  for (;;) {
    const snapshot = await db
      .ref("contactRequests")
      .orderByChild("createdAt")
      .endAt(cutoff)
      .limitToFirst(LARGE_BATCH)
      .once("value");

    if (!snapshot.exists()) break;

    const entries = [];
    snapshot.forEach((child) => {
      const value = child.val();
      entries.push({
        key: child.key,
        createdAt: value && typeof value === "object" ? value.createdAt : undefined,
      });
    });

    const batch = selectExpiredKeys(entries, cutoff);
    if (batch.totalDeleted === 0) break;   // only boundary/newer records remain

    await db.ref("contactRequests").update(batch.updates);
    totalDeleted += batch.totalDeleted;
    console.log(`Deleted batch: ${batch.totalDeleted}, total: ${totalDeleted}`);
  }

  console.log(`Manual cleanup completed with retentionDays=${retentionDays}. Deleted: ${totalDeleted}`);
}

manualCleanup().then(() => process.exit(0)).catch((err) => {
  console.error(err);
  process.exit(1);
});
```

Run:

```bash
cd functions
CONTACT_REQUEST_RETENTION_DAYS=90 node scripts/manual-cleanup.js
```

---

## Escalation

### When to Escalate

- Function fails for 2+ consecutive days
- Unexpected data deletion (>50% of expected)
- Security or permission errors
- Database performance issues
- Compliance concerns

### Escalation Contacts

1. **Technical Issues**: Firebase Operations Team
2. **Data/Compliance**: Data Protection Officer
3. **Emergency**: On-call Engineer

---

## Compliance & Audit

### Audit Trail

Every run logs:

- Timestamp of execution (`currentTimestamp` / `currentDate`)
- Retention period used (`retentionDays`) and its origin (`retentionSource`)
- Cutoff (`cutoffTimestamp` / `cutoffDate`)
- Counts (`totalInspected`, `totalDeleted`, `totalPreserved`)

Deploy-time configuration changes are recorded in `functions/backups/<timestamp>/`
by the deploy scripts.

### Compliance Requirements

- **GDPR**: Right to erasure after a reasonable period
- **Data Retention**: Configurable retention period, validated range 1–3650 days
- **Audit**: All operations logged, with the effective value on every run
- **Recovery**: No automatic recovery (database backups required)

### Regular Audits

**Quarterly Review**:

- [ ] Verify retention period aligns with policy
- [ ] Review deletion logs
- [ ] Check compliance with regulations
- [ ] Update documentation

---

## Change Log Template

When making changes, document:

```
Date: YYYY-MM-DD
Changed By: [Name]
Change Type: [Config/Code/Both]
Old Value: [e.g., 14 days]
New Value: [e.g., 90 days]
Reason: [Business/Compliance/Technical]
Impact: [Expected deletion counts, timing]
Verified: [Yes/No - date of verification, retentionSource seen in logs]
```

---

## Emergency Contacts

**Function Failures**: firebase-ops@example.com
**Data Issues**: data-protection@example.com
**On-Call**: +1-XXX-XXX-XXXX

---

## Related Documentation

- Project README, retention section: [`../README.md`](../README.md)
- Retention design (HLD/LLD): [`docs/RETENTION_DESIGN.md`](docs/RETENTION_DESIGN.md)
- Deployment scripts: [`scripts/README.md`](scripts/README.md)
- Configuration template: [`.env.example`](.env.example)
- Test specifications: [`test/features/contactRequestRetention.feature`](test/features/contactRequestRetention.feature)
- Source code: [`index.js`](index.js) (wiring), [`lib/retention.js`](lib/retention.js) (logic)
- Firebase Console: https://console.firebase.google.com

---

**Version**: 2.0.0
**Owner**: Firebase Operations Team
