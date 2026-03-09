import { get, ref } from "firebase/database";
import { database } from "../firebase";

export type DashboardStats = {
  users: number;
  posts: number;
  pendingPosts: number;
  reports: number;
};

export async function fetchDashboardStats(): Promise<DashboardStats> {
  const [usersSnap, postsSnap, reportsSnap] = await Promise.all([
    get(ref(database, "users")),
    get(ref(database, "posts")),
    get(ref(database, "reports"))
  ]);

  const users = usersSnap.exists() ? Object.keys(usersSnap.val()).length : 0;
  const postsObj = postsSnap.exists() ? (postsSnap.val() as Record<string, Record<string, unknown>>) : {};
  const reports = reportsSnap.exists() ? Object.keys(reportsSnap.val()).length : 0;
  const posts = Object.keys(postsObj).length;
  const pendingPosts = Object.values(postsObj).filter(
    (post) => (post.moderationStatus as string | undefined) !== "APPROVED"
  ).length;

  return {
    users,
    posts,
    pendingPosts,
    reports
  };
}
