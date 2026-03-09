import { get, push, ref, set, update } from "firebase/database";
import { database } from "../firebase";
import { BlogRecord, ContentSubmission, StoryRecord, SubmissionType } from "../types";

export const BLOG_TITLE_MAX = 120;
export const BLOG_CONTENT_MAX = 4000;
export const STORY_TITLE_MAX = 120;
export const STORY_CONTENT_MAX = 2200;
export const BLOG_CONTENT_MIN = 80;
export const STORY_CONTENT_MIN = 50;

export async function fetchPublishedBlogs(limit = 20): Promise<BlogRecord[]> {
  const snapshot = await get(ref(database, "publicContent/blogs"));
  const data = snapshot.exists() ? (snapshot.val() as Record<string, Record<string, unknown>>) : {};
  return Object.entries(data)
    .map(([id, raw]) => ({
      id,
      title: asString(raw.title) ?? "Untitled",
      authorName: asString(raw.authorName) ?? "BloodPoint Team",
      content: asString(raw.content) ?? "",
      createdAt: asNumber(raw.createdAt) ?? 0,
      publishedAt: asNumber(raw.publishedAt) ?? 0
    }))
    .sort((a, b) => (b.publishedAt || b.createdAt) - (a.publishedAt || a.createdAt))
    .slice(0, limit);
}

export async function fetchPublishedStories(limit = 20): Promise<StoryRecord[]> {
  const snapshot = await get(ref(database, "publicContent/stories"));
  const data = snapshot.exists() ? (snapshot.val() as Record<string, Record<string, unknown>>) : {};
  return Object.entries(data)
    .map(([id, raw]) => ({
      id,
      title: asString(raw.title) ?? "Untitled",
      authorName: asString(raw.authorName) ?? "Anonymous",
      content: asString(raw.content) ?? "",
      anonymous: asBoolean(raw.anonymous) ?? true,
      createdAt: asNumber(raw.createdAt) ?? 0,
      publishedAt: asNumber(raw.publishedAt) ?? 0
    }))
    .sort((a, b) => (b.publishedAt || b.createdAt) - (a.publishedAt || a.createdAt))
    .slice(0, limit);
}

export async function fetchBlogById(id: string): Promise<BlogRecord | null> {
  const snapshot = await get(ref(database, `publicContent/blogs/${id}`));
  if (!snapshot.exists()) return null;
  const raw = snapshot.val() as Record<string, unknown>;
  return {
    id,
    title: asString(raw.title) ?? "Untitled",
    authorName: asString(raw.authorName) ?? "BloodPoint Team",
    content: asString(raw.content) ?? "",
    createdAt: asNumber(raw.createdAt) ?? 0,
    publishedAt: asNumber(raw.publishedAt) ?? 0
  };
}

export async function fetchStoryById(id: string): Promise<StoryRecord | null> {
  const snapshot = await get(ref(database, `publicContent/stories/${id}`));
  if (!snapshot.exists()) return null;
  const raw = snapshot.val() as Record<string, unknown>;
  return {
    id,
    title: asString(raw.title) ?? "Untitled",
    authorName: asString(raw.authorName) ?? "Anonymous",
    content: asString(raw.content) ?? "",
    anonymous: asBoolean(raw.anonymous) ?? true,
    createdAt: asNumber(raw.createdAt) ?? 0,
    publishedAt: asNumber(raw.publishedAt) ?? 0
  };
}

export async function submitContent(input: {
  type: SubmissionType;
  title: string;
  content: string;
  authorName?: string;
  anonymous?: boolean;
}) {
  const now = Date.now();
  const bucket = input.type === "blog" ? "blogs" : "stories";
  const anonymous = input.type === "story" ? Boolean(input.anonymous) : false;
  const authorName = anonymous ? "Anonymous" : input.authorName?.trim() || "Community Contributor";
  const submissionRef = push(ref(database, `contentSubmissions/${bucket}`));
  const title = input.title.trim();
  const content = input.content.trim();

  await set(submissionRef, {
    type: input.type,
    title,
    content,
    authorName,
    anonymous,
    status: "PENDING",
    createdAt: now
  });
}

export function stripMarkdown(value: string): string {
  return value
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/`[^`]*`/g, " ")
    .replace(/!\[[^\]]*\]\([^)]+\)/g, " ")
    .replace(/\[[^\]]*\]\([^)]+\)/g, " ")
    .replace(/[>*_#~`\-\[\]\(\)]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function countWords(value: string): number {
  const plain = stripMarkdown(value);
  if (!plain) return 0;
  return plain.split(" ").filter(Boolean).length;
}

export async function fetchPendingSubmissions(): Promise<ContentSubmission[]> {
  const [blogsSnap, storiesSnap] = await Promise.all([
    get(ref(database, "contentSubmissions/blogs")),
    get(ref(database, "contentSubmissions/stories"))
  ]);

  const blogs = mapSubmissionBucket(blogsSnap.exists() ? blogsSnap.val() : {}, "blog");
  const stories = mapSubmissionBucket(storiesSnap.exists() ? storiesSnap.val() : {}, "story");

  return [...blogs, ...stories]
    .filter((row) => row.status === "PENDING")
    .sort((a, b) => b.createdAt - a.createdAt);
}

export async function publishSubmission(submission: ContentSubmission, adminUid: string) {
  const now = Date.now();
  const bucket = submission.type === "blog" ? "blogs" : "stories";
  const contentPath = submission.type === "blog" ? "publicContent/blogs" : "publicContent/stories";

  const publicRef = push(ref(database, contentPath));
  await set(publicRef, {
    title: submission.title,
    content: submission.content,
    authorName: submission.anonymous ? "Anonymous" : submission.authorName,
    anonymous: submission.anonymous,
    createdAt: submission.createdAt,
    publishedAt: now,
    sourceSubmissionId: submission.id
  });

  await update(ref(database, `contentSubmissions/${bucket}/${submission.id}`), {
    status: "APPROVED",
    reviewedBy: adminUid,
    reviewedAt: now
  });
}

export async function rejectSubmission(submission: ContentSubmission, adminUid: string, reason: string) {
  const now = Date.now();
  const bucket = submission.type === "blog" ? "blogs" : "stories";
  await update(ref(database, `contentSubmissions/${bucket}/${submission.id}`), {
    status: "REJECTED",
    reviewedBy: adminUid,
    reviewedAt: now,
    rejectionReason: reason.trim() || "Rejected by admin"
  });
}

function mapSubmissionBucket(
  rawData: Record<string, Record<string, unknown>>,
  type: SubmissionType
): ContentSubmission[] {
  return Object.entries(rawData).map(([id, raw]) => ({
    id,
    type,
    title: asString(raw.title) ?? "Untitled",
    authorName: asString(raw.authorName) ?? (type === "story" ? "Anonymous" : "Community Contributor"),
    content: asString(raw.content) ?? "",
    anonymous: asBoolean(raw.anonymous) ?? false,
    status: parseStatus(raw.status),
    createdAt: asNumber(raw.createdAt) ?? 0,
    reviewedAt: asNumber(raw.reviewedAt),
    reviewedBy: asString(raw.reviewedBy),
    rejectionReason: asString(raw.rejectionReason)
  }));
}

function parseStatus(value: unknown): "PENDING" | "APPROVED" | "REJECTED" {
  if (value === "PENDING" || value === "APPROVED" || value === "REJECTED") {
    return value;
  }
  return "PENDING";
}

function asString(value: unknown) {
  return typeof value === "string" ? value : undefined;
}

function asNumber(value: unknown) {
  return typeof value === "number" ? value : undefined;
}

function asBoolean(value: unknown) {
  return typeof value === "boolean" ? value : undefined;
}
