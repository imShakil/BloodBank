import { FormEvent, useState } from "react";
import { Link } from "react-router-dom";
import { PublicFooter, PublicHeader } from "../components/PublicChrome";
import {
  BLOG_CONTENT_MAX,
  BLOG_CONTENT_MIN,
  BLOG_TITLE_MAX,
  STORY_CONTENT_MAX,
  STORY_CONTENT_MIN,
  STORY_TITLE_MAX,
  countWords,
  submitContent
} from "../services/content";
import { SubmissionType } from "../types";

export function SubmitContentPage() {
  const [type, setType] = useState<SubmissionType>("blog");
  const [title, setTitle] = useState("");
  const [authorName, setAuthorName] = useState("");
  const [content, setContent] = useState("");
  const [anonymous, setAnonymous] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const maxTitle = type === "blog" ? BLOG_TITLE_MAX : STORY_TITLE_MAX;
  const maxContent = type === "blog" ? BLOG_CONTENT_MAX : STORY_CONTENT_MAX;
  const minWords = type === "blog" ? BLOG_CONTENT_MIN : STORY_CONTENT_MIN;
  const wordCount = countWords(content);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setMessage(null);

    if (!title.trim() || !content.trim()) {
      setError("শিরোনাম ও কনটেন্ট অবশ্যই দিতে হবে।");
      return;
    }
    if (title.trim().length > maxTitle) {
      setError(`শিরোনাম সর্বোচ্চ ${maxTitle} অক্ষর হতে পারবে।`);
      return;
    }
    if (content.trim().length > maxContent) {
      setError(`কনটেন্ট সর্বোচ্চ ${maxContent} অক্ষর হতে পারবে।`);
      return;
    }
    if (wordCount < minWords) {
      setError(`কমপক্ষে ${minWords} শব্দ লিখুন।`);
      return;
    }

    setSubmitting(true);
    try {
      await submitContent({
        type,
        title,
        content,
        authorName,
        anonymous: type === "story" ? anonymous : false
      });
      setMessage("সফলভাবে সাবমিট হয়েছে। অ্যাডমিন রিভিউর পরে এটি প্রকাশিত হবে।");
      setTitle("");
      setContent("");
      setAuthorName("");
      setAnonymous(false);
    } catch (e) {
      setError(getErrorMessage(e));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <PublicHeader />
      <main className="legal-page">
        <section className="legal-card">
          <div className="heading-row">
            <h1>ব্লগ বা স্টোরি সাবমিট করুন</h1>
            <Link className="btn" to="/">
              হোমে ফিরুন
            </Link>
          </div>
          <p className="muted">সব সাবমিশন প্রকাশের আগে অ্যাডমিন রিভিউ করা হবে।</p>
          {message ? <div className="card">{message}</div> : null}
          {error ? <div className="error">{error}</div> : null}

          <form className="submit-form" onSubmit={handleSubmit}>
              <label>
                ধরন
                <select value={type} onChange={(e) => setType(e.target.value as SubmissionType)}>
                  <option value="blog">ব্লগ</option>
                  <option value="story">স্টোরি</option>
                </select>
              </label>

              <label>
              শিরোনাম
              <input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={maxTitle} />
              <div className="muted">
                অক্ষর: {title.length}/{maxTitle}
              </div>
            </label>

            <label>
              লেখকের নাম {type === "story" ? "(ঐচ্ছিক)" : ""}
              <input
                value={authorName}
                onChange={(e) => setAuthorName(e.target.value)}
                maxLength={80}
                placeholder={type === "story" ? "Anonymous রাখতে চাইলে ফাঁকা রাখুন" : "আপনার নাম"}
              />
            </label>

            {type === "story" ? (
              <label className="checkbox">
                <input
                  type="checkbox"
                  checked={anonymous}
                  onChange={(e) => setAnonymous(e.target.checked)}
                />
                এই স্টোরিটি নাম প্রকাশ ছাড়া প্রকাশ করুন
              </label>
            ) : null}

            <label>
              কনটেন্ট
              <div className="editor-toolbar">
                <button type="button" className="btn tiny" onClick={() => setContent((c) => `${c}\n## `)}>
                  শিরোনাম
                </button>
                <button
                  type="button"
                  className="btn tiny"
                  onClick={() => setContent((c) => `${c}${c ? " " : ""}**গুরুত্বপূর্ণ**`)}
                >
                  বোল্ড
                </button>
                <button
                  type="button"
                  className="btn tiny"
                  onClick={() => setContent((c) => `${c}${c ? " " : ""}_ইটালিক_`)}
                >
                  ইটালিক
                </button>
                <button
                  type="button"
                  className="btn tiny"
                  onClick={() => setContent((c) => `${c}\n- পয়েন্ট ১\n- পয়েন্ট ২\n`)}
                >
                  তালিকা
                </button>
              </div>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={8}
                maxLength={maxContent}
              />
              <div className="muted">
                শব্দ: {wordCount} (ন্যূনতম {minWords}) · অক্ষর: {content.length}/{maxContent}
              </div>
            </label>

            <button className="btn primary" disabled={submitting} type="submit">
              {submitting ? "সাবমিট হচ্ছে..." : "রিভিউর জন্য সাবমিট করুন"}
            </button>
          </form>
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
