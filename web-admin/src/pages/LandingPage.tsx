import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { PublicFooter, PublicHeader } from "../components/PublicChrome";
import { fetchPublishedBlogs, fetchPublishedStories } from "../services/content";
import { LandingData, fetchLandingData } from "../services/landing";
import { BlogRecord, StoryRecord } from "../types";

const PLAY_STORE_URL = import.meta.env.VITE_PLAYSTORE_URL ?? "#";
const APK_PURE_URL = import.meta.env.VITE_APKPURE_URL ?? "https://apkpure.com/p/com.bloodpoint.iunoob";
const DIRECT_APK_URL = import.meta.env.VITE_DIRECT_APK_URL ?? "https://github.com/imShakil/BloodBank/releases/latest/download/bloodpoint.apk";
const TELEGRAM_CHANNEL_URL = "https://t.me/mybplink";
const TELEGRAM_COMMUNITY_URL = "https://t.me/+og5pFf-HLqllMmVl";

const SCREENSHOT_FILES = [
  "01.jpeg",
  "02.jpeg",
  "03.jpeg",
  "04.jpeg",
  "05.jpeg",
  "06.jpeg",
  "07.jpeg",
  "08.jpeg",
  "09.jpeg"
];

export function LandingPage() {
  const [data, setData] = useState<LandingData | null>(null);
  const [blogs, setBlogs] = useState<BlogRecord[]>([]);
  const [stories, setStories] = useState<StoryRecord[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [slideIndex, setSlideIndex] = useState(0);
  const slides = useMemo(
    () => SCREENSHOT_FILES.map((name) => `/screenshoots/${encodeURIComponent(name)}`),
    []
  );

  useEffect(() => {
    let active = true;
    fetchLandingData()
      .then((result) => {
        if (active) {
          setData(result);
        }
      })
      .catch((e) => {
        if (active) {
          setError(getErrorMessage(e));
        }
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    fetchPublishedBlogs(3).then(setBlogs).catch(() => setBlogs([]));
    fetchPublishedStories(3).then(setStories).catch(() => setStories([]));
  }, []);

  useEffect(() => {
    if (!slides.length) return;
    const timer = window.setInterval(() => {
      setSlideIndex((prev) => (prev + 1) % slides.length);
    }, 3200);
    return () => window.clearInterval(timer);
  }, [slides.length]);

  return (
    <div className="landing-page">
      <PublicHeader />
      <header className="hero">
        <div className="hero-overlay">
          <div className="hero-grid">
            <div>
              <h1>আপনার এক ব্যাগ রক্ত, কারও নতুন জীবন।</h1>
              <p>
                একটি অ্যাপেই সহজে খুঁজে নিন নিকটবর্তী রক্তদাতা, যুক্ত থাকুন বিশ্বস্ত ডোনার কমিউনিটির সাথে এবং জরুরি রিকোয়েস্ট মুহূর্তেই পৌঁছে দিন সবার কাছে।
              </p>
              <div className="download-actions">
                <a className="hero-btn primary" href={PLAY_STORE_URL} rel="noreferrer">
                  প্লে স্টোর লিংক
                </a>
                <a className="hero-btn secondary" href={APK_PURE_URL} target="_blank" rel="noreferrer">
                  APKPure লিংক
                </a>
                <a className="hero-btn secondary" href={DIRECT_APK_URL} target="_blank" rel="noreferrer">
                  ডাউনলোড APK ফাইল
                </a>

                <a
                  className="hero-btn community"
                  href={TELEGRAM_COMMUNITY_URL}
                  target="_blank"
                  rel="noreferrer"
                >
                  টেলিগ্রাম কমিউনিটি তে যোগদিন
                </a>
                <a
                  className="hero-btn community"
                  href={TELEGRAM_CHANNEL_URL}
                  target="_blank"
                  rel="noreferrer"
                >
                  আপডেট পেতে সাবস্ক্রাইভ করুন
                </a>

              </div>
            </div>
            <div className="carousel">
              <img src={slides[slideIndex]} alt={`BloodPoint screenshot ${slideIndex + 1}`} />
              <button
                className="carousel-arrow left"
                onClick={() => setSlideIndex((prev) => (prev - 1 + slides.length) % slides.length)}
                aria-label="Previous slide"
              >
                ‹
              </button>
              <button
                className="carousel-arrow right"
                onClick={() => setSlideIndex((prev) => (prev + 1) % slides.length)}
                aria-label="Next slide"
              >
                ›
              </button>
              <div className="carousel-dots">
                {slides.map((_, idx) => (
                  <button
                    key={idx}
                    className={idx === slideIndex ? "active" : ""}
                    onClick={() => setSlideIndex(idx)}
                    aria-label={`Go to slide ${idx + 1}`}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </header>

      <section className="landing-section">
        <h2>মূল ফিচারসমূহ</h2>
        <div className="feature-grid">
          <FeatureCard title="স্মার্ট ডোনার সার্চ" text="রক্তের গ্রুপ ও জেলা অনুযায়ী দ্রুত ডোনার খুঁজুন।" />
          <FeatureCard title="জরুরি পোস্ট" text="জরুরি রক্তের অনুরোধ পোস্ট করুন এবং দ্রুত সাড়া পান।" />
          <FeatureCard title="ট্রাস্ট ও মডারেশন" text="অ্যাডমিন রিভিউ ও রিপোর্টিংয়ের মাধ্যমে নিরাপদ প্ল্যাটফর্ম।" />
          <FeatureCard title="কন্টাক্ট ওয়ার্কফ্লো" text="উপযুক্ত ডোনারের সাথে রিকোয়েস্ট ও সংযোগ সহজ করুন।" />
        </div>
        <div className="left-column" style={{ marginTop: 18 }}>
          <h2>কমিউনিটি আপডেট</h2>
          {data?.updatedAt ? (
            <div className="muted snapshot-updated">
              সর্বশেষ: {new Date(data.updatedAt).toLocaleString("bn-BD")}
            </div>
          ) : null}
          {error ? (
            <div className="error">
              লাইভ ডাটা এখন পাওয়া যাচ্ছে না ({error})। নিশ্চিত অ্যাক্সেসের জন্য অ্যাডমিনে লগইন করুন।
            </div>
          ) : null}
          <div className="cards landing-metrics">
            <MetricCard label="এখন অনলাইনে" value={data?.activeNow ?? 0} />
            <MetricCard label="মোট ব্যবহারকারী" value={data?.totalUsers ?? 0} />
            <MetricCard label="মোট পোস্ট" value={data?.totalPosts ?? 0} />
          </div>
        </div>
      </section>

      <section className="landing-section">
        <h2>ব্লগ ও স্টোরি</h2>
        <div className="split">
          <div className="panel right-feed">
            <div className="heading-row">
              <h3>সর্বশেষ ব্লগ</h3>
              <Link to="/blogs">সব দেখুন</Link>
            </div>
            <ul>
              {blogs.map((blog) => (
                <li key={blog.id}>
                  <Link className="feed-title" to={`/blogs/${blog.id}`}>
                    {blog.title}
                  </Link>
                  <div className="feed-meta">{blog.authorName}</div>
                </li>
              ))}
            </ul>
            {blogs.length === 0 ? <div className="muted">এখনও কোনো ব্লগ প্রকাশিত হয়নি।</div> : null}
          </div>
          <div className="panel right-feed">
            <div className="heading-row">
              <h3>সর্বশেষ স্টোরি</h3>
              <Link to="/stories">সব দেখুন</Link>
            </div>
            <ul>
              {stories.map((story) => (
                <li key={story.id}>
                  <Link className="feed-title" to={`/stories/${story.id}`}>
                    {story.title}
                  </Link>
                  <div className="feed-meta">
                    {story.anonymous ? "নাম প্রকাশে অনিচ্ছুক" : story.authorName}
                  </div>
                </li>
              ))}
            </ul>
            {stories.length === 0 ? <div className="muted">এখনও কোনো স্টোরি প্রকাশিত হয়নি।</div> : null}
          </div>
        </div>
      </section>

      <section className="landing-section">
        <h2>রিকোয়েস্ট ও নতুন ডোনার</h2>
        <div className="split">
          <div className="panel">
            <h3>সাম্প্রতিক রক্তের অনুরোধ</h3>
            <ul>
              {(data?.recentPosts ?? []).map((post) => (
                <li key={post.id}>
                  {post.name} এর জন্য {post.bloodGroup} রক্ত প্রয়োজন ।
                  {/* <span>{post.name}</span>
                  <strong>{post.bloodGroup}</strong> */}
                </li>
              ))}
            </ul>
          </div>
          <div className="panel">
            <h3>নতুন যোগ হয়েছেন</h3>
            <ul>
              {(data?.newDonors ?? []).map((donor) => (
                <li key={donor.uid}>
                  {donor.district} থেকে {donor.name}
                  {/* <span>{donor.name}</span>
                  <strong>{donor.district} থেকে</strong>  */}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}

function FeatureCard({ title, text }: { title: string; text: string }) {
  return (
    <article className="feature-card">
      <h3>{title}</h3>
      <p>{text}</p>
    </article>
  );
}

function MetricCard({ label, value }: { label: string; value: number }) {
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
