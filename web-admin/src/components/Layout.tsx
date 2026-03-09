import { Link, NavLink, Outlet } from "react-router-dom";
import { signOut } from "firebase/auth";
import { auth } from "../firebase";
import { useAuth } from "../auth/AuthContext";

export function Layout() {
  const { user, role } = useAuth();
  const canAccessUsers = role === "super-admin" || role === "verifier";
  const canAccessPosts = role === "super-admin" || role === "moderator";
  const canAccessReports = role === "super-admin" || role === "moderator";
  const canAccessContent = role === "super-admin" || role === "moderator";

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <Link className="brand" to="/">
          BloodPoint App
        </Link>
        <nav className="nav-links">
          <NavLink to="/admin" end>
            ড্যাশবোর্ড
          </NavLink>
          {canAccessUsers ? <NavLink to="/admin/users">ইউজার</NavLink> : null}
          {canAccessPosts ? <NavLink to="/admin/posts">পোস্ট</NavLink> : null}
          {canAccessReports ? <NavLink to="/admin/reports">রিপোর্ট</NavLink> : null}
          {canAccessContent ? <NavLink to="/admin/content">কনটেন্ট</NavLink> : null}
        </nav>
      </aside>
      <section className="content">
        <header className="topbar">
          <div>{user?.email ?? "লগইন করা আছে"}</div>
          <button className="btn" onClick={() => signOut(auth)}>
            সাইন আউট
          </button>
        </header>
        <main>
          <Outlet />
        </main>
      </section>
    </div>
  );
}
