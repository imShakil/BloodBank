import { useEffect, useState } from "react";
import { DashboardStats, fetchDashboardStats } from "../services/stats";

export function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    fetchDashboardStats()
      .then((result) => {
        if (mounted) {
          setStats(result);
        }
      })
      .catch((e) => {
        if (mounted) {
          setError(getErrorMessage(e));
        }
      });
    return () => {
      mounted = false;
    };
  }, []);

  if (error) {
    return <div className="error">ড্যাশবোর্ড লোড করা যায়নি: {error}</div>;
  }

  if (!stats) {
    return <div className="center">ড্যাশবোর্ড লোড হচ্ছে...</div>;
  }

  return (
    <section>
      <h2>মনিটরিং সারাংশ</h2>
      <div className="cards">
        <StatCard label="মোট ইউজার" value={stats.users} />
        <StatCard label="মোট পোস্ট" value={stats.posts} />
        <StatCard label="পেন্ডিং মডারেশন" value={stats.pendingPosts} />
        <StatCard label="খোলা রিপোর্ট" value={stats.reports} />
      </div>
    </section>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <article className="card">
      <div className="muted">{label}</div>
      <div className="value">{value.toLocaleString()}</div>
    </article>
  );
}

function getErrorMessage(error: unknown) {
  if (typeof error === "object" && error && "message" in error) {
    return String((error as { message?: unknown }).message ?? "Unknown error");
  }
  return "Unknown error";
}
