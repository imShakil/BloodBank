import { useEffect, useState } from "react";
import { useAuth } from "../auth/AuthContext";
import { fetchPendingSubmissions, publishSubmission, rejectSubmission } from "../services/content";
import { ContentSubmission } from "../types";

export function AdminContentPage() {
  const { user } = useAuth();
  const [pending, setPending] = useState<ContentSubmission[]>([]);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [previewItem, setPreviewItem] = useState<ContentSubmission | null>(null);

  async function load() {
    setError(null);
    try {
      setPending(await fetchPendingSubmissions());
    } catch (e) {
      setError(getErrorMessage(e));
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function handleApprove(item: ContentSubmission) {
    if (!user) return;
    setBusyId(item.id);
    setError(null);
    try {
      await publishSubmission(item, user.uid);
      await load();
    } catch (e) {
      setError(getErrorMessage(e));
    } finally {
      setBusyId(null);
    }
  }

  async function handleReject(item: ContentSubmission) {
    if (!user) return;
    const reason = window.prompt("রিজেক্ট করার কারণ (ঐচ্ছিক):", "") ?? "";
    setBusyId(item.id);
    setError(null);
    try {
      await rejectSubmission(item, user.uid, reason);
      await load();
    } catch (e) {
      setError(getErrorMessage(e));
    } finally {
      setBusyId(null);
    }
  }

  return (
    <section>
      <h2>কনটেন্ট মডারেশন (ব্লগ ও স্টোরি)</h2>
      <p className="muted">পাবলিশ করতে অ্যাপ্রুভ করুন, না হলে কারণসহ রিজেক্ট করুন।</p>
      {error ? <div className="error">ব্যর্থ: {error}</div> : null}
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>ধরণ</th>
              <th>শিরোনাম</th>
              <th>লেখক</th>
              <th>সাবমিট সময়</th>
              <th>কনটেন্ট</th>
              <th>অ্যাকশন</th>
            </tr>
          </thead>
          <tbody>
            {pending.map((item) => (
              <tr key={item.id}>
                <td>{item.type}</td>
                <td>{item.title}</td>
                <td>{item.anonymous ? "নাম প্রকাশে অনিচ্ছুক" : item.authorName}</td>
                <td>{new Date(item.createdAt).toLocaleString("bn-BD")}</td>
                <td>{truncate(item.content, 180)}</td>
                <td>
                  <div className="inline-actions">
                    <button className="btn tiny" onClick={() => setPreviewItem(item)}>
                      পড়ুন
                    </button>
                    <button
                      className="btn tiny"
                      disabled={busyId === item.id}
                      onClick={() => handleApprove(item)}
                    >
                      পাবলিশ
                    </button>
                    <button
                      className="btn tiny"
                      disabled={busyId === item.id}
                      onClick={() => handleReject(item)}
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
      {pending.length === 0 ? (
        <div className="muted" style={{ marginTop: 10 }}>
          কোনো পেন্ডিং কনটেন্ট নেই।
        </div>
      ) : null}

      {previewItem ? (
        <div className="modal-backdrop" onClick={() => setPreviewItem(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="heading-row">
              <h3>{previewItem.title}</h3>
              <button className="btn tiny" onClick={() => setPreviewItem(null)}>
                বন্ধ করুন
              </button>
            </div>
            <div className="muted">
              {previewItem.type} ·{" "}
              {previewItem.anonymous ? "নাম প্রকাশে অনিচ্ছুক" : previewItem.authorName} ·{" "}
              {new Date(previewItem.createdAt).toLocaleString("bn-BD")}
            </div>
            <div className="modal-body">{previewItem.content}</div>
          </div>
        </div>
      ) : null}
    </section>
  );
}

function truncate(value: string, max: number) {
  if (value.length <= max) return value;
  return `${value.slice(0, max)}...`;
}

function getErrorMessage(error: unknown) {
  if (typeof error === "object" && error && "message" in error) {
    return String((error as { message?: unknown }).message ?? "Unknown error");
  }
  return "Unknown error";
}
