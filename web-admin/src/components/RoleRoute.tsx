import { Navigate } from "react-router-dom";
import { AdminRole, useAuth } from "../auth/AuthContext";

export function RoleRoute({
  children,
  allowedRoles
}: {
  children: JSX.Element;
  allowedRoles: AdminRole[];
}) {
  const { user, role, roleLoading } = useAuth();

  if (!user) {
    return <Navigate to="/admin/login" replace />;
  }

  if (roleLoading) {
    return <div className="center">রোল যাচাই করা হচ্ছে...</div>;
  }

  if (!role || !allowedRoles.includes(role)) {
    return <Navigate to="/admin" replace />;
  }

  return children;
}
