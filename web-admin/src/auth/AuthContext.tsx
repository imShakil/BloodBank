import { ReactNode, createContext, useContext, useEffect, useMemo, useState } from "react";
import { User, onAuthStateChanged } from "firebase/auth";
import { get, ref } from "firebase/database";
import { auth } from "../firebase";
import { database } from "../firebase";

export type AdminRole = "super-admin" | "moderator" | "verifier" | "billing-admin" | "viewer";

type AuthContextValue = {
  user: User | null;
  loading: boolean;
  role: AdminRole | null;
  roleLoading: boolean;
};

const AuthContext = createContext<AuthContextValue>({
  user: null,
  loading: true,
  role: null,
  roleLoading: true
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<AdminRole | null>(null);
  const [roleLoading, setRoleLoading] = useState(true);

  useEffect(() => {
    return onAuthStateChanged(auth, (nextUser) => {
      setUser(nextUser);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    let active = true;

    async function loadRole() {
      if (!user) {
        if (active) {
          setRole(null);
          setRoleLoading(false);
        }
        return;
      }

      if (active) {
        setRoleLoading(true);
      }

      try {
        const snapshot = await get(ref(database, `admins/${user.uid}/role`));
        if (active) {
          setRole(parseRole(snapshot.val()));
        }
      } catch {
        if (active) {
          setRole(null);
        }
      } finally {
        if (active) {
          setRoleLoading(false);
        }
      }
    }

    loadRole();
    return () => {
      active = false;
    };
  }, [user]);

  const value = useMemo(() => ({ user, loading, role, roleLoading }), [user, loading, role, roleLoading]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}

function parseRole(value: unknown): AdminRole | null {
  if (
    value === "super-admin" ||
    value === "moderator" ||
    value === "verifier" ||
    value === "billing-admin" ||
    value === "viewer"
  ) {
    return value;
  }
  return null;
}
