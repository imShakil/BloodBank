import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { PublicFooter, PublicHeader } from "../components/PublicChrome";
import { fetchPublishedBlogs } from "../services/content";
import { BlogRecord } from "../types";

export function BlogsPage() {
  const [blogs, setBlogs] = useState<BlogRecord[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchPublishedBlogs()
      .then(setBlogs)
      .catch((e) => setError(getErrorMessage(e)));
  }, []);

  return (
    <>
      <PublicHeader />
      <main className="legal-page">
        <section className="legal-card">
          <div className="heading-row">
            <h1>ব্লগ</h1>
            <Link className="btn" to="/submit-content">
              ব্লগ সাবমিট করুন
            </Link>
          </div>
          {error ? <div className="error">ব্লগ লোড করা যায়নি: {error}</div> : null}
          <div className="content-list">
            {blogs.map((blog) => (
              <article key={blog.id} className="content-item">
                <h2>
                  <Link to={`/blogs/${blog.id}`}>{blog.title}</Link>
                </h2>
                <div className="muted">
                  লিখেছেন: {blog.authorName} · {formatDate(blog.publishedAt || blog.createdAt)}
                </div>
                <p>{truncate(blog.content, 220)}</p>
                <Link className="btn tiny" to={`/blogs/${blog.id}`}>
                  পুরো ব্লগ পড়ুন
                </Link>
              </article>
            ))}
            {blogs.length === 0 ? <div className="muted">এখনও কোনো ব্লগ প্রকাশিত হয়নি।</div> : null}
          </div>
        </section>
      </main>
      <PublicFooter />
    </>
  );
}

function truncate(value: string, max: number) {
  if (value.length <= max) return value;
  return `${value.slice(0, max)}...`;
}

function formatDate(value: number) {
  if (!value) return "তারিখ পাওয়া যায়নি";
  return new Date(value).toLocaleString("bn-BD");
}

function getErrorMessage(error: unknown) {
  if (typeof error === "object" && error && "message" in error) {
    return String((error as { message?: unknown }).message ?? "Unknown error");
  }
  return "Unknown error";
}
