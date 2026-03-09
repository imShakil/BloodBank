import { get, ref } from "firebase/database";
import { database } from "../firebase";

export type LandingData = {
  totalUsers: number;
  totalPosts: number;
  activeNow: number;
  recentPosts: Array<{ id: string; name: string; bloodGroup: string }>;
  newDonors: Array<{ uid: string; name: string; district: string }>;
  updatedAt: number;
};

export async function fetchLandingData(): Promise<LandingData> {
  const snapshot = await get(ref(database, "publicLanding"));
  const data = snapshot.exists() ? (snapshot.val() as Record<string, unknown>) : {};

  const recentPostsRaw = asArray(data.recentPosts);
  const newDonorsRaw = asArray(data.newDonors);

  return {
    totalUsers: asNumber(data.totalUsers) ?? 0,
    totalPosts: asNumber(data.totalPosts) ?? 0,
    activeNow: asNumber(data.activeNow) ?? asNumber(data.dailyActiveUsers) ?? 0,
    updatedAt: asNumber(data.updatedAt) ?? 0,
    recentPosts: recentPostsRaw.slice(0, 8).map((item, index) => {
      const row = asObject(item);
      return {
        id: asString(row.id) ?? `post-${index}`,
        name: asString(row.name) ?? "Unknown",
        bloodGroup: asString(row.bloodGroup) ?? "N/A"
      };
    }),
    newDonors: newDonorsRaw.slice(0, 8).map((item, index) => {
      const row = asObject(item);
      return {
        uid: asString(row.uid) ?? `donor-${index}`,
        name: asString(row.name) ?? "Unknown donor",
        district: asString(row.district) ?? "Unknown district"
      };
    })
  };
}

function asString(value: unknown) {
  return typeof value === "string" ? value : undefined;
}

function asNumber(value: unknown) {
  return typeof value === "number" ? value : undefined;
}

function asArray(value: unknown) {
  return Array.isArray(value) ? value : [];
}

function asObject(value: unknown): Record<string, unknown> {
  return typeof value === "object" && value ? (value as Record<string, unknown>) : {};
}
