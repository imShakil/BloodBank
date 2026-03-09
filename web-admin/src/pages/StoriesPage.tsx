import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { PublicFooter, PublicHeader } from "../components/PublicChrome";
import { fetchPublishedStories } from "../services/content";
import { StoryRecord } from "../types";

export function StoriesPage() {
  const [stories, setStories] = useState<StoryRecord[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchPublishedStories()
      .then(setStories)
      .catch((e) => setError(getErrorMessage(e)));
  }, []);

  return (
    <>
      <PublicHeader />
      <main className="legal-page">
        <section className="legal-card">
          <div className="heading-row">
            <h1>স্টোরি</h1>
            <Link className="btn" to="/submit-content">
              স্টোরি শেয়ার করুন
            </Link>
          </div>
          {error ? <div className="error">স্টোরি লোড করা যায়নি: {error}</div> : null}
          <div className="content-list">
            {stories.map((story) => (
              <article key={story.id} className="content-item">
                <h2>
                  <Link to={`/stories/${story.id}`}>{story.title}</Link>
                </h2>
                <div className="muted">
                  লিখেছেন: {story.anonymous ? "নাম প্রকাশে অনিচ্ছুক" : story.authorName} ·{" "}
                  {formatDate(story.publishedAt || story.createdAt)}
                </div>
                <p>{truncate(story.content, 220)}</p>
                <Link className="btn tiny" to={`/stories/${story.id}`}>
                  পুরো স্টোরি পড়ুন
                </Link>
              </article>
            ))}
            {stories.length === 0 ? <div className="muted">এখনও কোনো স্টোরি প্রকাশিত হয়নি।</div> : null}
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
