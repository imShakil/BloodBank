import { get, ref } from "firebase/database";
import { database } from "../firebase";
import { ReportRecord } from "../types";

export async function fetchReports(limit = 300): Promise<ReportRecord[]> {
  const snapshot = await get(ref(database, "reports"));
  const data = (snapshot.val() ?? {}) as Record<string, Record<string, unknown>>;
  return Object.entries(data)
    .slice(0, limit)
    .map(([reportId, raw]) => ({
      reportId,
      reporterUid: asString(raw.reporterUid) ?? "",
      reportedUid: asString(raw.reportedUid) ?? "",
      reason: asString(raw.reason) ?? "",
      timestamp: asNumber(raw.timestamp) ?? 0,
      contentType: asContentType(raw.contentType) ?? "USER"
    }))
    .sort((a, b) => b.timestamp - a.timestamp);

function asContentType(value: unknown): "POST" | "USER" | undefined {
  return value === "POST" || value === "USER" ? value : undefined;
}
}

function asString(value: unknown) {
  return typeof value === "string" ? value : undefined;
}

function asNumber(value: unknown) {
  return typeof value === "number" ? value : undefined;
}
