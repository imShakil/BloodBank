import { get, push, ref, update } from "firebase/database";
import { database } from "../firebase";
import { PostRecord } from "../types";

export async function fetchPosts(limit = 300): Promise<PostRecord[]> {
  const snapshot = await get(ref(database, "posts"));
  const data = (snapshot.val() ?? {}) as Record<string, Record<string, unknown>>;
  return Object.entries(data)
    .slice(0, limit)
    .map(([postId, raw]) => ({
      postId,
      authorUid: asString(raw.authorUid) ?? "",
      Name: asString(raw.Name),
      District: asString(raw.District),
      BloodGroup: asString(raw.BloodGroup),
      Time: asNumber(raw.Time),
      moderationStatus: parseModerationStatus(raw.moderationStatus),
      isVisible: asBoolean(raw.isVisible),
      reviewedAt: asNumber(raw.reviewedAt),
      reviewedBy: asString(raw.reviewedBy),
      flagReason: asString(raw.flagReason)
    }))
    .sort((a, b) => (b.Time ?? 0) - (a.Time ?? 0));
}

export async function moderatePost(
  postId: string,
  adminUid: string,
  action: "APPROVED" | "REJECTED",
  reason?: string
) {
  const postRef = ref(database, `posts/${postId}`);
  const visible = action === "APPROVED";
  await update(postRef, {
    moderationStatus: action,
    isVisible: visible,
    reviewedBy: adminUid,
    reviewedAt: Date.now(),
    flagReason: reason ?? ""
  });

  const auditRef = ref(database, "moderationAudit");
  await push(auditRef, {
    action,
    postId,
    adminUid,
    details: reason ?? "",
    timestamp: Date.now()
  });
}

function asString(value: unknown) {
  return typeof value === "string" ? value : undefined;
}

function asNumber(value: unknown) {
  return typeof value === "number" ? value : undefined;
}

function asBoolean(value: unknown) {
  return typeof value === "boolean" ? value : undefined;
}

function parseModerationStatus(value: unknown): PostRecord["moderationStatus"] {
  if (value === "PENDING" || value === "APPROVED" || value === "REJECTED") {
    return value;
  }
  return "PENDING";
}
