/**
 * Contact request retention logic.
 *
 * Kept free of `firebase-functions` / `firebase-admin` imports so it can be
 * unit tested directly. `functions/index.js` is only wiring: it resolves the
 * configured retention period and injects the database + logger into
 * `runContactRequestCleanup`.
 */

/** Milliseconds in one day. */
const MILLISECONDS_PER_DAY = 24 * 60 * 60 * 1000;

/**
 * Documented default retention period, in days.
 *
 * This is the single source of truth: `index.js` passes it as the `default` of
 * the CONTACT_REQUEST_RETENTION_DAYS param, the docs quote it, and the tests
 * assert on it. Changing it here changes it everywhere.
 */
const DEFAULT_CONTACT_REQUEST_RETENTION_DAYS = 90;

/** How many records to process per run to avoid memory issues. */
const BATCH_SIZE = 200;

/** Accepted range for a configured retention period, in days. */
const MIN_RETENTION_DAYS = 1;
const MAX_RETENTION_DAYS = 3650;   // ~10 years

/**
 * Validate a configured retention period and fall back to the default when it
 * is unusable.
 *
 * A retention of 0 (or negative) would set the cutoff at — or in the future of
 * — "now" and delete every contact request, so it is rejected rather than
 * honoured. Same for non-integers and values outside the accepted range.
 *
 * @param {unknown} raw Value from configuration (param, env var, or undefined).
 * @returns {{retentionDays: number, source: "configured"|"default", warning?: string}}
 */
function resolveRetentionDays(raw) {
  if (raw === undefined || raw === null || raw === "") {
    return { retentionDays: DEFAULT_CONTACT_REQUEST_RETENTION_DAYS, source: "default" };
  }

  // Only numbers and numeric strings are meaningful here; anything else (a
  // boolean, an object) would coerce to a misleading number.
  const parsed = typeof raw === "number" ? raw : typeof raw === "string" ? Number(raw) : NaN;

  if (!Number.isInteger(parsed)) {
    return {
      retentionDays: DEFAULT_CONTACT_REQUEST_RETENTION_DAYS,
      source: "default",
      warning:
        `CONTACT_REQUEST_RETENTION_DAYS must be a whole number of days, got ${JSON.stringify(raw)} — ` +
        `falling back to the default of ${DEFAULT_CONTACT_REQUEST_RETENTION_DAYS} days`,
    };
  }

  if (parsed < MIN_RETENTION_DAYS || parsed > MAX_RETENTION_DAYS) {
    return {
      retentionDays: DEFAULT_CONTACT_REQUEST_RETENTION_DAYS,
      source: "default",
      warning:
        `CONTACT_REQUEST_RETENTION_DAYS must be between ${MIN_RETENTION_DAYS} and ${MAX_RETENTION_DAYS} days, ` +
        `got ${parsed} — falling back to the default of ${DEFAULT_CONTACT_REQUEST_RETENTION_DAYS} days`,
    };
  }

  return { retentionDays: parsed, source: "configured" };
}

/**
 * Resolve the effective retention period from the Firebase param and the
 * environment variable backing it.
 *
 * `defineInt(...).value()` cannot be trusted on its own. Verified against
 * firebase-functions v7:
 *   - variable absent  → returns 0, NOT the declared default. A param's default
 *     is resolved by the Firebase CLI at deploy time and baked into the deployed
 *     function's environment; `.value()` does not apply it at runtime.
 *   - variable "abc"   → returns 0 (silent coercion)
 *   - variable "30.5"  → returns 30 (silent truncation)
 *
 * A raw 0 reaching `computeCutoff` would put the cutoff at "now" and delete
 * every contact request, so absence and junk must not be mistaken for a real
 * configuration. This function validates the raw string — which still carries
 * the distinction — and treats an absent variable as "not configured", so the
 * logs say `source: "default"` rather than warning about a value nobody set.
 *
 * @param {object} input
 * @param {unknown} input.envValue `process.env.CONTACT_REQUEST_RETENTION_DAYS`.
 * @param {unknown} [input.paramValue] Result of `defineInt(...).value()`.
 * @returns {{retentionDays: number, source: "configured"|"default", warning?: string}}
 */
function resolveEffectiveRetention({ envValue, paramValue } = {}) {
  if (envValue === undefined || envValue === null || String(envValue).trim() === "") {
    // Not configured. Ignore paramValue: unset it is a misleading 0.
    return resolveRetentionDays(undefined);
  }

  // Validate the raw string, not the param's already-coerced int, so that
  // "abc" and "30.5" produce accurate warnings instead of a silent 0 or 30.
  const fromEnv = resolveRetentionDays(String(envValue).trim());
  if (fromEnv.source === "default") {
    return fromEnv;   // invalid configuration → warning + documented default
  }

  // The variable holds a valid in-range integer. Prefer the param accessor,
  // which is the supported way to read a param and agrees with it in practice.
  return resolveRetentionDays(paramValue === undefined ? fromEnv.retentionDays : paramValue);
}

/**
 * Cutoff timestamp for a retention period: records created strictly before
 * this instant are eligible for deletion.
 *
 * @param {number} nowMs Current time in epoch milliseconds.
 * @param {number} retentionDays Effective retention period, in days.
 * @returns {number} Cutoff timestamp in epoch milliseconds.
 */
function computeCutoff(nowMs, retentionDays) {
  return nowMs - retentionDays * MILLISECONDS_PER_DAY;
}

/**
 * Decide which contact requests to delete.
 *
 * Boundary behaviour is deliberate and covered by tests:
 * - `createdAt <  cutoff` → DELETE (older than the retention period)
 * - `createdAt === cutoff` → KEEP  (exactly at the boundary is still within retention)
 * - `createdAt >  cutoff` → KEEP  (newer than the retention period)
 *
 * A missing or non-numeric `createdAt` is coerced to 0, which is older than any
 * realistic cutoff, so such records are DELETED. Note that Firebase RTDB sorts
 * children lacking the ordered key first, so they always fall inside an
 * `endAt(cutoff)` window and do reach this function.
 *
 * @param {Array<{key: string, createdAt: unknown}>} entries Candidate records.
 * @param {number} cutoff Cutoff timestamp from `computeCutoff`.
 * @returns {{updates: Object<string, null>, totalInspected: number, totalDeleted: number, totalPreserved: number}}
 */
function selectExpiredKeys(entries, cutoff) {
  const updates = {};
  let totalInspected = 0;
  let totalDeleted = 0;

  for (const entry of entries) {
    totalInspected++;

    const createdAt =
      typeof entry.createdAt === "number" && Number.isFinite(entry.createdAt)
        ? entry.createdAt
        : 0;   // missing/invalid createdAt → treated as infinitely old → deleted

    if (createdAt < cutoff) {
      updates[entry.key] = null;   // RTDB deletes a child by setting it to null
      totalDeleted++;
    }
  }

  return {
    updates,
    totalInspected,
    totalDeleted,
    totalPreserved: totalInspected - totalDeleted,
  };
}

/**
 * Delete contact requests older than the effective retention period.
 *
 * @param {object} deps
 * @param {import("firebase-admin/database").Database} deps.db
 * @param {{info: Function, warn: Function}} deps.logger
 * @param {number} deps.retentionDays Effective retention period, in days.
 * @param {number} deps.now Current time in epoch milliseconds.
 * @param {"configured"|"default"} [deps.retentionSource] Where the value came from.
 * @returns {Promise<{retentionDays: number, cutoff: number, totalInspected: number, totalDeleted: number, totalPreserved: number}>}
 */
async function runContactRequestCleanup({
  db,
  logger,
  retentionDays,
  now,
  retentionSource = "default",
}) {
  const cutoff = computeCutoff(now, retentionDays);

  logger.info("cleanupOldContactRequests: starting", {
    retentionDays,
    retentionSource,
    cutoffTimestamp: cutoff,
    cutoffDate: new Date(cutoff).toISOString(),
    currentTimestamp: now,
    currentDate: new Date(now).toISOString(),
    batchSize: BATCH_SIZE,
  });

  // endAt(cutoff) is inclusive, so records exactly at the cutoff are fetched.
  // selectExpiredKeys then preserves them — the boundary rule lives there, in
  // one place, rather than being split between the query and the loop.
  const snapshot = await db
    .ref("contactRequests")
    .orderByChild("createdAt")
    .endAt(cutoff)
    .limitToFirst(BATCH_SIZE)
    .once("value");

  if (!snapshot.exists()) {
    logger.info("cleanupOldContactRequests: nothing to clean up", {
      retentionDays,
      cutoffTimestamp: cutoff,
      totalInspected: 0,
      totalDeleted: 0,
      totalPreserved: 0,
    });
    return { retentionDays, cutoff, totalInspected: 0, totalDeleted: 0, totalPreserved: 0 };
  }

  const entries = [];
  snapshot.forEach((child) => {
    const value = child.val();
    entries.push({
      key: child.key,
      createdAt: value && typeof value === "object" ? value.createdAt : undefined,
    });
  });

  const { updates, totalInspected, totalDeleted, totalPreserved } = selectExpiredKeys(
    entries,
    cutoff
  );

  if (totalDeleted > 0) {
    await db.ref("contactRequests").update(updates);
  }

  logger.info("cleanupOldContactRequests: completed", {
    retentionDays,
    retentionSource,
    totalInspected,
    totalDeleted,
    totalPreserved,
    cutoffTimestamp: cutoff,
    cutoffDate: new Date(cutoff).toISOString(),
  });

  // Hitting the batch limit means more eligible records may remain; the next
  // scheduled run picks them up (daily, so large backlogs clear over days).
  if (totalInspected >= BATCH_SIZE) {
    logger.warn(
      "cleanupOldContactRequests: batch limit reached — more old requests may remain",
      { batchSize: BATCH_SIZE, retentionDays, totalInspected }
    );
  }

  return { retentionDays, cutoff, totalInspected, totalDeleted, totalPreserved };
}

module.exports = {
  MILLISECONDS_PER_DAY,
  DEFAULT_CONTACT_REQUEST_RETENTION_DAYS,
  BATCH_SIZE,
  MIN_RETENTION_DAYS,
  MAX_RETENTION_DAYS,
  resolveRetentionDays,
  resolveEffectiveRetention,
  computeCutoff,
  selectExpiredKeys,
  runContactRequestCleanup,
};
