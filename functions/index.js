/**
 * BloodPoint Cloud Functions
 *
 * Scheduled cleanup tasks:
 * 1. cleanupExpiredPosts      — Deletes blood request posts past their expiryAt date (runs daily at 3:00 AM UTC)
 * 2. cleanupOldContactRequests — Deletes contact requests older than 90 days (runs daily at 3:30 AM UTC)
 * 3. publishPublicLandingSnapshot — Publishes sanitized public landing metrics (runs every 5 minutes)
 */

const { onSchedule } = require("firebase-functions/v2/scheduler");
const { logger }      = require("firebase-functions");
const { initializeApp } = require("firebase-admin/app");
const { getDatabase }   = require("firebase-admin/database");

initializeApp();

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

/** How many records to process per batch to avoid memory issues. */
const BATCH_SIZE = 200;

/** Contact requests older than this many days will be deleted. */
const CONTACT_REQUEST_RETENTION_DAYS = 14;

/** Public landing list limits. */
const LANDING_RECENT_POSTS_LIMIT = 8;
const LANDING_NEW_DONORS_LIMIT = 8;

// ---------------------------------------------------------------------------
// 1. Cleanup Expired Posts – runs every day at 03:00 UTC
// ---------------------------------------------------------------------------

exports.cleanupExpiredPosts = onSchedule(
  {
    schedule: "every day 03:00",
    timeZone: "UTC",
    retryCount: 1,
    memory: "256MiB",
  },
  async (_event) => {
    const db   = getDatabase();
    const now  = Date.now();
    let totalDeleted = 0;

    logger.info("cleanupExpiredPosts: starting — cutoff timestamp", { now });

    // Query posts where expiryAt > 0 AND expiryAt < now.
    // Firebase RTDB only supports a single orderByChild, so we fetch posts
    // ordered by expiryAt, ending at the current timestamp, and skip 0-values
    // (posts with no expiry).
    const snapshot = await db
      .ref("posts")
      .orderByChild("expiryAt")
      .startAt(1)       // skip posts with expiryAt == 0 (no expiry)
      .endAt(now)        // expiryAt <= now → expired
      .limitToFirst(BATCH_SIZE)
      .once("value");

    if (!snapshot.exists()) {
      logger.info("cleanupExpiredPosts: no expired posts found");
      return;
    }

    const updates = {};
    snapshot.forEach((child) => {
      updates[child.key] = null;   // delete by setting to null
      totalDeleted++;
    });

    await db.ref("posts").update(updates);

    logger.info("cleanupExpiredPosts: deleted expired posts", { totalDeleted });

    // If we hit the batch limit there may be more — log a warning so the next
    // run picks them up (scheduled daily; extreme backlogs clear over days).
    if (totalDeleted >= BATCH_SIZE) {
      logger.warn(
        "cleanupExpiredPosts: batch limit reached — more expired posts may remain"
      );
    }
  }
);

// ---------------------------------------------------------------------------
// 2. Cleanup Old Contact Requests – runs every day at 03:30 UTC
// ---------------------------------------------------------------------------

exports.cleanupOldContactRequests = onSchedule(
  {
    schedule: "every day 03:30",
    timeZone: "UTC",
    retryCount: 1,
    memory: "256MiB",
  },
  async (_event) => {
    const db      = getDatabase();
    const cutoff  = Date.now() - CONTACT_REQUEST_RETENTION_DAYS * 24 * 60 * 60 * 1000;
    let totalDeleted = 0;

    logger.info("cleanupOldContactRequests: starting", {
      retentionDays: CONTACT_REQUEST_RETENTION_DAYS,
      cutoffTimestamp: cutoff,
    });

    const snapshot = await db
      .ref("contactRequests")
      .orderByChild("createdAt")
      .endAt(cutoff)                       // createdAt <= cutoff → older than 90 days
      .limitToFirst(BATCH_SIZE)
      .once("value");

    if (!snapshot.exists()) {
      logger.info("cleanupOldContactRequests: nothing to clean up");
      return;
    }

    const updates = {};
    snapshot.forEach((child) => {
      updates[child.key] = null;
      totalDeleted++;
    });

    await db.ref("contactRequests").update(updates);

    logger.info("cleanupOldContactRequests: deleted old contact requests", {
      totalDeleted,
    });

    if (totalDeleted >= BATCH_SIZE) {
      logger.warn(
        "cleanupOldContactRequests: batch limit reached — more old requests may remain"
      );
    }
  }
);

// ---------------------------------------------------------------------------
// 3. Publish Public Landing Snapshot – runs every 5 minutes
// ---------------------------------------------------------------------------

exports.publishPublicLandingSnapshot = onSchedule(
  {
    schedule: "every 5 minutes",
    timeZone: "UTC",
    retryCount: 1,
    memory: "256MiB",
  },
  async (_event) => {
    const db = getDatabase();
    const now = Date.now();

    logger.info("publishPublicLandingSnapshot: started");

    const [usersSnap, postsSnap, presenceSnap] = await Promise.all([
      db.ref("users").once("value"),
      db.ref("posts").once("value"),
      db.ref("presence").once("value"),
    ]);

    const usersObj = usersSnap.exists() ? usersSnap.val() : {};
    const postsObj = postsSnap.exists() ? postsSnap.val() : {};
    const presenceObj = presenceSnap.exists() ? presenceSnap.val() : {};

    const posts = Object.entries(postsObj).map(([id, raw]) => {
      const row = asObject(raw);
      return {
        id,
        name: asString(row.Name) || "Unknown",
        bloodGroup: asString(row.BloodGroup) || "N/A",
        authorUid: asString(row.authorUid) || "",
        time: asNumber(row.Time) || 0,
      };
    });

    const activeNow = Object.values(presenceObj).filter((raw) => {
      const row = asObject(raw);
      return row.online === true;
    }).length;

    const recentPosts = posts
      .sort((a, b) => b.time - a.time)
      .slice(0, LANDING_RECENT_POSTS_LIMIT)
      .map((post) => ({
        id: post.id,
        name: post.name,
        bloodGroup: post.bloodGroup,
      }));

    const donors = Object.entries(usersObj).map(([uid, raw]) => {
      const row = asObject(raw);
      return {
        uid,
        name: asString(row.Name || row.name) || "Unknown donor",
        district: asString(row.District || row.district) || "Unknown district",
        joinedAt:
          asNumber(row.joinedAt) ||
          asNumber(row.createdAt) ||
          asNumber(row.registeredAt) ||
          asNumber(row.Time) ||
          0,
      };
    });

    const newDonors = donors
      .sort((a, b) => b.joinedAt - a.joinedAt)
      .slice(0, LANDING_NEW_DONORS_LIMIT)
      .map((donor) => ({
        uid: donor.uid,
        name: donor.name,
        district: donor.district,
      }));

    await db.ref("publicLanding").set({
      totalUsers: Object.keys(usersObj).length,
      totalPosts: Object.keys(postsObj).length,
      activeNow,
      recentPosts,
      newDonors,
      updatedAt: now,
    });

    logger.info("publishPublicLandingSnapshot: completed", {
      totalUsers: Object.keys(usersObj).length,
      totalPosts: Object.keys(postsObj).length,
      activeNow,
      recentPosts: recentPosts.length,
      newDonors: newDonors.length,
    });
  }
);

function asString(value) {
  return typeof value === "string" ? value : undefined;
}

function asNumber(value) {
  return typeof value === "number" ? value : undefined;
}

function asObject(value) {
  return typeof value === "object" && value ? value : {};
}
