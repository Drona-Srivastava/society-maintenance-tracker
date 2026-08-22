import { Navigate, Route, Routes } from "react-router-dom";

import { useAuth } from "./context/AuthContext";

import AppLayout from "./components/layout/AppLayout";

import Login from "./pages/Login";

import ResidentDashboard from "./pages/resident/Dashboard";
import Complaints from "./pages/resident/Complaints";
import ComplaintDetail from "./pages/resident/ComplaintDetail";
import NewComplaint from "./pages/resident/NewComplaint";
import Notices from "./pages/resident/Notices";
import NoticeDetail from "./pages/resident/NoticeDetail";
import Profile from "./pages/resident/Profile";

import AdminDashboard from "./pages/admin/Dashboard";
import AdminNotices from "./pages/admin/Notices";
import ProtectedRoute from "./routes/ProtectedRoute";
import RoleRoute from "./routes/RoleRoute";
import AdminComplaints from "./pages/admin/Complaints";
import AdminComplaintDetail from "./pages/admin/ComplaintDetail";
import AdminProfile from "./pages/admin/Profile";

function HomeRedirect() {
  const { user } = useAuth();

  if (user?.role === "admin") {
    return <Navigate to="/admin" replace />;
  }

  return <Navigate to="/dashboard" replace />;
}

function App() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/login" element={<Login />} />

      {/* Authenticated */}
      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          {/* Role-aware home */}
          <Route
            path="/"
            element={<HomeRedirect />}
          />

          {/* =========================
              RESIDENT
          ========================= */}
          <Route element={<RoleRoute role="resident" />}>
            <Route
              path="/dashboard"
              element={<ResidentDashboard />}
            />

            <Route
              path="/complaints"
              element={<Complaints />}
            />

            <Route
              path="/complaints/new"
              element={<NewComplaint />}
            />

            <Route
              path="/complaints/:complaintId"
              element={<ComplaintDetail />}
            />

            <Route
              path="/notices"
              element={<Notices />}
            />

            <Route
              path="/notices/:noticeId"
              element={<NoticeDetail />}
            />

            <Route
              path="/profile"
              element={<Profile />}
            />
          </Route>

          {/* =========================
              ADMIN
          ========================= */}
          <Route element={<RoleRoute role="admin" />}>
            <Route
              path="/admin"
              element={<AdminDashboard />}
            />

            <Route
              path="/admin/complaints"
              element={<AdminComplaints />}
            />

            <Route
              path="/admin/complaints/:complaintId"
              element={<AdminComplaintDetail />}
            />
            <Route
              path="/admin/notices"
              element={<AdminNotices />}
            />
            <Route
              path="/admin/profile"
              element={<AdminProfile />}
            />
          </Route>
        </Route>
      </Route>

      {/* Unknown route */}
      <Route
        path="*"
        element={<Navigate to="/" replace />}
      />
    </Routes>
  );
}

export default App;