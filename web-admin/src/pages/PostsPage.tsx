import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../auth/AuthContext";
import { fetchPosts, moderatePost } from "../services/posts";
import { PostRecord } from "../types";

type StatusFilter = "ALL" | "PENDING" | "APPROVED" | "REJECTED";

export function PostsPage() {
  const { user } = useAuth();
  const [posts, setPosts] = useState<PostRecord[]>([]);
  const [filter, setFilter] = useState<StatusFilter>("ALL");
  const [busyPost, setBusyPost] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setError(null);
    try {
      const list = await fetchPosts();
      setPosts(list);
    } catch (e) {
      setError(getErrorMessage(e));
    }
  }

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    if (filter === "ALL") {
      return posts;
    }
    return posts.filter((post) => (post.moderationStatus ?? "PENDING") === filter);
  }, [posts, filter]);

  async function moderate(postId: string, action: "APPROVED" | "REJECTED") {
    if (!user) {
      return;
    }
    setBusyPost(postId);
    setError(null);
    try {
      await moderatePost(postId, user.uid, action, action === "REJECTED" ? "Rejected by admin" : "");
      await load();
    } catch (e) {
      setError(getErrorMessage(e));
    } finally {
      setBusyPost(null);
    }
  }

  return (
    <section>
      <div className="heading-row">
        <h2>পোস্ট মডারেশন</h2>
        <select value={filter} onChange={(e) => setFilter(e.target.value as StatusFilter)}>
          <option value="ALL">সব</option>
          <option value="PENDING">পেন্ডিং</option>
          <option value="APPROVED">অ্যাপ্রুভড</option>
          <option value="REJECTED">রিজেক্টেড</option>
        </select>
      </div>
      {error ? <div className="error">অ্যাকশন ব্যর্থ: {error}</div> : null}
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Post ID</th>
              <th>লেখক UID</th>
              <th>রক্তের গ্রুপ</th>
              <th>জেলা</th>
              <th>স্ট্যাটাস</th>
              <th>পোস্টের সময়</th>
              <th>অ্যাকশন</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((post) => (
              <tr key={post.postId}>
                <td className="mono">{post.postId}</td>
                <td className="mono">{post.authorUid}</td>
                <td>{post.BloodGroup ?? "-"}</td>
                <td>{post.District ?? "-"}</td>
                <td>{post.moderationStatus ?? "PENDING"}</td>
                <td>{formatTimestamp(post.Time)}</td>
                <td>
                  <div className="inline-actions">
                    <button
                      className="btn tiny"
                      disabled={busyPost === post.postId}
                      onClick={() => moderate(post.postId, "APPROVED")}
                    >
                      অ্যাপ্রুভ
                    </button>
                    <button
                      className="btn tiny"
                      disabled={busyPost === post.postId}
                      onClick={() => moderate(post.postId, "REJECTED")}
                    >
                      রিজেক্ট
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function formatTimestamp(value?: number) {
  if (!value) {
    return "-";
  }
  return new Date(value).toLocaleString();
}

function getErrorMessage(error: unknown) {
  if (typeof error === "object" && error && "message" in error) {
    return String((error as { message?: unknown }).message ?? "Unknown error");
  }
  return "Unknown error";
}
