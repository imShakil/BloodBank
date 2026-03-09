import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { PublicFooter, PublicHeader } from "../components/PublicChrome";
import { fetchStoryById } from "../services/content";
import { StoryRecord } from "../types";

export function StoryDetailPage() {
  const { id = "" } = useParams();
  const [story, setStory] = useState<StoryRecord | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchStoryById(id)
      .then((result) => {
        if (!result) {
          setError("স্টোরি পাওয়া যায়নি।");
          return;
        }
        setStory(result);
      })
      .catch((e) => setError(getErrorMessage(e)));
  }, [id]);

  return (
    <>
      <PublicHeader />
      <main className="legal-page">
        <section className="legal-card">
          {error ? <div className="error">{error}</div> : null}
          {story ? (
            <article className="content-item">
              <h1>{story.title}</h1>
              <div className="muted">
                লিখেছেন: {story.anonymous ? "নাম প্রকাশে অনিচ্ছুক" : story.authorName} ·{" "}
                {new Date(story.publishedAt || story.createdAt).toLocaleString("bn-BD")}
              </div>
              <p>{story.content}</p>
            </article>
          ) : (
            <div className="muted">লোড হচ্ছে...</div>
          )}
          <div className="legal-actions">
            <Link className="btn" to="/stories">
              সব স্টোরিতে ফিরুন
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
