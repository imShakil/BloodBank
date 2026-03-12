import { useEffect, useState } from "react";
import { fetchReports } from "../services/reports";
import { ReportRecord } from "../types";

export function ReportsPage() {
  const [reports, setReports] = useState<ReportRecord[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchReports()
      .then(setReports)
      .catch((e) => setError(getErrorMessage(e)));
  }, []);

  return (
    <section>
      <h2>ইউজার রিপোর্ট</h2>
      {error ? <div className="error">রিপোর্ট লোড করা যায়নি: {error}</div> : null}
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Report ID</th>
              <th>রিপোর্টকারী UID</th>
              <th>রিপোর্টকৃত UID</th>
              <th>রিপোর্ট টাইপ</th>
              <th>কারণ</th>
              <th>সময়</th>
            </tr>
          </thead>
          <tbody>
            {reports.map((report) => (
              <tr key={report.reportId}>
                <td className="mono">{report.reportId}</td>
                <td className="mono">{report.reporterUid}</td>
                <td className="mono">{report.reportedUid}</td>
                <td>{report.contentType === "POST" ? "Post" : "Profile"}</td>
                <td>{report.reason}</td>
                <td>{new Date(report.timestamp).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function getErrorMessage(error: unknown) {
  if (typeof error === "object" && error && "message" in error) {
    return String((error as { message?: unknown }).message ?? "Unknown error");
  }
  return "Unknown error";
}
