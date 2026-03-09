import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../auth/AuthContext";
import { fetchUsers, setUserVerification } from "../services/users";
import { UserRecord } from "../types";

export function UsersPage() {
  const { user } = useAuth();
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [search, setSearch] = useState("");
  const [busyUid, setBusyUid] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setError(null);
    try {
      const list = await fetchUsers();
      setUsers(list);
    } catch (e) {
      setError(getErrorMessage(e));
    }
  }

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) {
      return users;
    }
    return users.filter((item) =>
      [item.uid, item.name, item.phone, item.bloodGroup, item.district].some((value) =>
        (value ?? "").toLowerCase().includes(q)
      )
    );
  }, [users, search]);

  async function updateStatus(uid: string, status: "VERIFIED" | "PENDING" | "REJECTED") {
    if (!user) {
      return;
    }
    setBusyUid(uid);
    setError(null);
    try {
      await setUserVerification(uid, status, user.uid);
      await load();
    } catch (e) {
      setError(getErrorMessage(e));
    } finally {
      setBusyUid(null);
    }
  }

  return (
    <section>
      <div className="heading-row">
        <h2>ইউজার</h2>
        <input
          className="search"
          placeholder="UID, নাম, ফোন, জেলা দিয়ে সার্চ..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>
      {error ? <div className="error">অ্যাকশন ব্যর্থ: {error}</div> : null}
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>UID</th>
              <th>নাম</th>
              <th>ফোন</th>
              <th>রক্তের গ্রুপ</th>
              <th>জেলা</th>
              <th>ভেরিফিকেশন</th>
              <th>অ্যাকশন</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((item) => (
              <tr key={item.uid}>
                <td className="mono">{item.uid}</td>
                <td>{item.name ?? "-"}</td>
                <td>{item.phone ?? "-"}</td>
                <td>{item.bloodGroup ?? "-"}</td>
                <td>{item.district ?? "-"}</td>
                <td>{item.verificationStatus ?? "PENDING"}</td>
                <td>
                  <div className="inline-actions">
                    <button
                      className="btn tiny"
                      disabled={busyUid === item.uid}
                      onClick={() => updateStatus(item.uid, "VERIFIED")}
                    >
                      ভেরিফাই
                    </button>
                    <button
                      className="btn tiny"
                      disabled={busyUid === item.uid}
                      onClick={() => updateStatus(item.uid, "REJECTED")}
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
    </section>
  );
}

function getErrorMessage(error: unknown) {
  if (typeof error === "object" && error && "message" in error) {
    return String((error as { message?: unknown }).message ?? "Unknown error");
  }
  return "Unknown error";
}
