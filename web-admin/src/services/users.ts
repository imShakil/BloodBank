import { get, ref, update } from "firebase/database";
import { database } from "../firebase";
import { UserRecord } from "../types";

export async function fetchUsers(limit = 200): Promise<UserRecord[]> {
  const snapshot = await get(ref(database, "users"));
  const data = (snapshot.val() ?? {}) as Record<string, Record<string, unknown>>;
  return Object.entries(data)
    .slice(0, limit)
    .map(([uid, raw]) => ({
      uid,
      name: asString(raw.Name ?? raw.name),
      phone: asString(raw.Phone ?? raw.phone),
      bloodGroup: asString(raw.BloodGroup ?? raw.bloodGroup),
      district: asString(raw.District ?? raw.district),
      verificationStatus: asString(raw.verificationStatus)
    }));
}

export async function setUserVerification(
  uid: string,
  status: "VERIFIED" | "PENDING" | "REJECTED",
  reviewerUid: string
) {
  const path = `users/${uid}`;
  await update(ref(database, path), {
    verificationStatus: status,
    verificationReviewedBy: reviewerUid,
    verificationReviewedAt: Date.now()
  });
}

function asString(value: unknown) {
  return typeof value === "string" ? value : undefined;
}
