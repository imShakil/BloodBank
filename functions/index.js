/**
 * BloodPoint Cloud Functions
 *
 * Scheduled cleanup tasks:
 * 1. cleanupExpiredPosts      — Deletes blood request posts past their expiryAt date (runs daily at 3:00 AM UTC)
 * 2. cleanupOldContactRequests — Deletes contact requests older than 90 days (runs daily at 3:30 AM UTC)
 * 3. publishPublicLandingSnapshot — Publishes sanitized public landing metrics (runs every 5 minutes)
 * 4. Push Notification - 
 */

const { onSchedule } = require("firebase-functions/v2/scheduler");
const { logger }      = require("firebase-functions");
const { initializeApp } = require("firebase-admin/app");
const { getDatabase }   = require("firebase-admin/database");
const { getMessaging } = require("firebase-admin/messaging");
const { onValueCreated } = require("firebase-functions/v2/database");
const { onValueWritten } = require("firebase-functions/v2/database");

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

// Increment totalPosts when a new post is created
exports.incrementLandingPostMetric = onValueWritten({ ref: "posts/{postId}", region: "us-central1" }, async (event) => {
  if (!event.data.before.exists() && event.data.after.exists()) {
    // New post created
    const db = getDatabase();
    await db.ref("publicLanding/totalPosts").transaction((current) => (current || 0) + 1);
    logger.info("incrementLandingPostMetric: totalPosts incremented");
  }
});

// Increment totalUsers when a new user is created
exports.incrementLandingUserMetric = onValueWritten({ ref: "users/{userId}", region: "us-central1" }, async (event) => {
  if (!event.data.before.exists() && event.data.after.exists()) {
    // New user created
    const db = getDatabase();
    await db.ref("publicLanding/totalUsers").transaction((current) => (current || 0) + 1);
    logger.info("incrementLandingUserMetric: totalUsers incremented");
  }
});

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

    // Count posts and users directly for accuracy
    const totalUsers = Object.keys(usersObj).length;
    const totalPosts = Object.keys(postsObj).length;

    await db.ref("publicLanding").set({
      totalUsers,
      totalPosts,
      activeNow,
      recentPosts,
      newDonors,
      updatedAt: now,
    });

    logger.info("publishPublicLandingSnapshot: completed", {
      totalUsers,
      totalPosts,
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

//---------------------------
//** 4. Push Notifications **/
//---------------------------

/**
 * Triggered when a new blood request post is created in /posts.
 * Finds eligible donors in the same district/division and sends FCM push notifications.
 */

exports.notifyEligibleDonorsOnNewRequest = onValueCreated({ ref: "posts/{postId}", region: "us-central1" }, async (event) => {
  const db = getDatabase();
  const messaging = getMessaging();
  const post = event.data.val();
  if (!post) return;

  // Extract location and urgency from post
  const { district, division, urgency, bloodGroup, postId } = post;
  if (!district && !division) {
    logger.warn("Post missing location info", { postId });
    return;
  }

  // Query eligible donors in /users
  const usersSnap = await db.ref("users").once("value");
  if (!usersSnap.exists()) return;
  const users = usersSnap.val();

  // Step 1: Try district+thana match
  const thana = post.thana || post.Thana || post.subDistrict || post.thanaName;
  let eligibleDonors = Object.entries(users)
    .filter(([uid, user]) => {
      const locMatch = (user.district === district && user.thana === thana);
      const isActive = user.activeDonor === true;
      const phoneVerified = user.phoneVerified === true;
      const notBlocked = user.blocked !== true;
      const wantsNotif = user.optOutNotifications !== true;
      const hasToken = Array.isArray(user.fcmTokens) && user.fcmTokens.length > 0;
      return locMatch && isActive && phoneVerified && notBlocked && wantsNotif && hasToken;
    })
    .map(([uid, user]) => ({ uid, tokens: user.fcmTokens }));

  // Step 2: If none found, fallback to district only
  if (eligibleDonors.length === 0) {
    eligibleDonors = Object.entries(users)
      .filter(([uid, user]) => {
        const locMatch = (user.district === district);
        const isActive = user.activeDonor === true;
        const phoneVerified = user.phoneVerified === true;
        const notBlocked = user.blocked !== true;
        const wantsNotif = user.optOutNotifications !== true;
        const hasToken = Array.isArray(user.fcmTokens) && user.fcmTokens.length > 0;
        return locMatch && isActive && phoneVerified && notBlocked && wantsNotif && hasToken;
      })
      .map(([uid, user]) => ({ uid, tokens: user.fcmTokens }));
  }

  if (eligibleDonors.length === 0) {
    logger.info("No eligible donors found for post", { postId });
    return;
  }

  // Prioritize and randomize eligible donors
  // Sort by lastDonationDate (oldest first), then by donationCount (lowest first)
  eligibleDonors.sort((a, b) => {
    const userA = users[a.uid];
    const userB = users[b.uid];
    const lastA = userA.lastDonationDate || 0;
    const lastB = userB.lastDonationDate || 0;
    const countA = userA.donationCount || 0;
    const countB = userB.donationCount || 0;
    if (lastA !== lastB) return lastA - lastB;
    return countA - countB;
  });

  // Randomize within priority (shuffle top 100, then pick 50)
  function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }
  eligibleDonors = shuffle(eligibleDonors.slice(0, 100)).slice(0, 50);

  // Prepare notification payload
  const notification = {
    title: `Urgent Blood Request (${bloodGroup || "Any"})`,
    body: `Urgency: ${urgency || "Normal"}. Location: ${district || division}. Tap to view details.`,
    click_action: `/posts/${postId}`,
  };
  const dataPayload = {
    postId: postId,
    urgency: String(urgency || "Normal"),
    location: String(district || division),
    bloodGroup: String(bloodGroup || "Any"),
  };

  // Send notifications to each donor's FCM tokens (max 50)
  let totalSent = 0;
  for (const donor of eligibleDonors) {
    for (const token of donor.tokens) {
      try {
        await messaging.send({
          token,
          notification,
          data: dataPayload,
        });
        totalSent++;
      } catch (err) {
        logger.warn("Failed to send FCM notification", { uid: donor.uid, token, error: err.message });
      }
    }
  }
  logger.info("Blood request notifications sent", { postId, totalSent, limitedTo: eligibleDonors.length });
});