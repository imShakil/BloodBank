import { Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider } from "./auth/AuthContext";
import { LandingPage } from "./pages/LandingPage";
import { BlogDetailPage } from "./pages/BlogDetailPage";
import { BlogsPage } from "./pages/BlogsPage";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { RoleRoute } from "./components/RoleRoute";
import { Layout } from "./components/Layout";
import { AdminContentPage } from "./pages/AdminContentPage";
import { DashboardPage } from "./pages/DashboardPage";
import { LoginPage } from "./pages/LoginPage";
import { PostsPage } from "./pages/PostsPage";
import { PrivacyPolicyPage } from "./pages/PrivacyPolicyPage";
import { ReportsPage } from "./pages/ReportsPage";
import { StoryDetailPage } from "./pages/StoryDetailPage";
import { StoriesPage } from "./pages/StoriesPage";
import { SubmitContentPage } from "./pages/SubmitContentPage";
import { TermsPage } from "./pages/TermsPage";
import { UsersPage } from "./pages/UsersPage";

export function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/blogs" element={<BlogsPage />} />
        <Route path="/blogs/:id" element={<BlogDetailPage />} />
        <Route path="/stories" element={<StoriesPage />} />
        <Route path="/stories/:id" element={<StoryDetailPage />} />
        <Route path="/submit-content" element={<SubmitContentPage />} />
        <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
        <Route path="/terms" element={<TermsPage />} />
        <Route path="/admin/login" element={<LoginPage />} />
        <Route path="/login" element={<Navigate to="/admin/login" replace />} />
        <Route
          path="/admin"
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route index element={<DashboardPage />} />
          <Route
            path="users"
            element={
              <RoleRoute allowedRoles={["super-admin", "verifier"]}>
                <UsersPage />
              </RoleRoute>
            }
          />
          <Route
            path="posts"
            element={
              <RoleRoute allowedRoles={["super-admin", "moderator"]}>
                <PostsPage />
              </RoleRoute>
            }
          />
          <Route path="reports" element={<ReportsPage />} />
          <Route
            path="content"
            element={
              <RoleRoute allowedRoles={["super-admin", "moderator"]}>
                <AdminContentPage />
              </RoleRoute>
            }
          />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  );
}
