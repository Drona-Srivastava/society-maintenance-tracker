import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function NotFound() {
  const { user } = useAuth();

  const destination = user
    ? user.role === "admin"
      ? "/admin"
      : "/dashboard"
    : "/login";

  return (
    <main className="empty-state">
      <strong>Page not found</strong>

      <p>
        The page you're looking for doesn't exist or may have been moved.
      </p>

      <Link to={destination} className="secondary-button">
        {user ? "Go to dashboard" : "Go to login"}
      </Link>
    </main>
  );
}
