import { FormEvent, useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { Navigate } from "react-router-dom";
import { auth } from "../firebase";
import { useAuth } from "../auth/AuthContext";

export function LoginPage() {
  const { user } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  if (user) {
    return <Navigate to="/admin" replace />;
  }

  async function handleEmailLogin(event: FormEvent) {
    event.preventDefault();
    setError(null);
    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
    } catch (e) {
      setError(getErrorMessage(e));
    }
  }

  return (
    <div className="auth-wrap">
      <form className="auth-card" onSubmit={handleEmailLogin}>
        <h1>BloodPoint অ্যাডমিন</h1>
        <p>ইউজার, পোস্ট, মডারেশন ও রিপোর্ট ম্যানেজ করতে লগইন করুন।</p>
        <label>
          ইমেইল
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </label>
        <label>
          পাসওয়ার্ড
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </label>
        {error ? <div className="error">{error}</div> : null}
        <button type="submit" className="btn primary">
          সাইন ইন
        </button>
      </form>
    </div>
  );
}

function getErrorMessage(error: unknown) {
  if (typeof error === "object" && error && "message" in error) {
    return String((error as { message?: unknown }).message ?? "লগইন ব্যর্থ হয়েছে");
  }
  return "লগইন ব্যর্থ হয়েছে";
}
