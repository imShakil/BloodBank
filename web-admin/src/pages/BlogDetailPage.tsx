import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { PublicFooter, PublicHeader } from "../components/PublicChrome";
import { fetchBlogById } from "../services/content";
import { BlogRecord } from "../types";

export function BlogDetailPage() {
  const { id = "" } = useParams();
  const [blog, setBlog] = useState<BlogRecord | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchBlogById(id)
      .then((result) => {
        if (!result) {
          setError("ব্লগ পাওয়া যায়নি।");
          return;
        }
        setBlog(result);
      })
      .catch((e) => setError(getErrorMessage(e)));
  }, [id]);

  return (
    <>
      <PublicHeader />
      <main className="legal-page">
        <section className="legal-card">
          {error ? <div className="error">{error}</div> : null}
          {blog ? (
            <article className="content-item">
              <h1>{blog.title}</h1>
              <div className="muted">
                লিখেছেন: {blog.authorName} · {new Date(blog.publishedAt || blog.createdAt).toLocaleString("bn-BD")}
              </div>
              <p>{blog.content}</p>
            </article>
          ) : (
            <div className="muted">লোড হচ্ছে...</div>
          )}
          <div className="legal-actions">
            <Link className="btn" to="/blogs">
              সব ব্লগে ফিরুন
            </Link>
          </div>
        </section>
      </main>
      <PublicFooter />
    </>
  );
}

function getErrorMessage(error: unknown) {
  if (typeof error === "object" && error && "message" in error) {
    return String((error as { message?: unknown }).message ?? "Unknown error");
  }
  return "Unknown error";
}
