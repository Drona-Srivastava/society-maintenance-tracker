import { Navigate, Outlet } from "react-router-dom";

import { useAuth } from "../context/AuthContext";
import LoadingState from "../components/ui/LoadingState";

export default function ProtectedRoute() {
  const {
    user,
    loading,
    authError,
    retryAuth,
  } = useAuth();

  if (loading) {
    return (
      <LoadingState message="Checking your session..." />
    );
  }

  if (authError) {
    return (
      <div className="dashboard-error" role="alert">
        <div>
          <strong>Unable to connect</strong>
          <p>{authError}</p>

          <button
            type="button"
            className="secondary-button"
            onClick={retryAuth}
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}
