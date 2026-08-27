import { Bell } from "lucide-react";

import { useAuth } from "../../context/AuthContext";

export default function Topbar() {
  const { user } = useAuth();

  const firstName = user?.name?.split(" ")[0] || "there";

  return (
    <header className="topbar">
      <div className="topbar-copy">
        <span className="topbar-context">
          {user?.role === "admin"
            ? "Administration"
            : "Resident Portal"}
        </span>

        <h1>
          Good to see you, {firstName}
        </h1>
      </div>

      <button
        type="button"
        className="notification-button"
        aria-label="Notifications"
      >
        <Bell size={19} strokeWidth={1.8} />
      </button>
    </header>
  );
}