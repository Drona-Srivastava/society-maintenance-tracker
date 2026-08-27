import { Bell, ClipboardList, Home, LogOut, UserCircle } from "lucide-react";
import { NavLink } from "react-router-dom";

import { useAuth } from "../../context/AuthContext";

export default function Sidebar() {
  const { user, logout } = useAuth();

  const isAdmin = user?.role === "admin";

  const links = isAdmin
    ? [
        {
          to: "/admin",
          label: "Dashboard",
          icon: Home,
        },
        {
          to: "/admin/complaints",
          label: "Complaints",
          icon: ClipboardList,
        },
        {
          to: "/admin/notices",
          label: "Notices",
          icon: Bell,
        },
        {
          to: "/admin/profile",
          label: "Profile",
          icon: UserCircle,
        },
      ]
    : [
        {
          to: "/dashboard",
          label: "Dashboard",
          icon: Home,
        },
        {
          to: "/complaints",
          label: "Complaints",
          icon: ClipboardList,
        },
        {
          to: "/notices",
          label: "Notices",
          icon: Bell,
        },
        {
          to: "/profile",
          label: "Profile",
          icon: UserCircle,
        },
      ];

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <div className="brand-mark">SM</div>

        <div className="brand-copy">
          <strong>Society</strong>
          <span>Maintenance Tracker</span>
        </div>
      </div>

      <nav className="sidebar-nav">
        <p className="nav-label">{isAdmin ? "Administration" : "Resident"}</p>

        {links.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === "/dashboard" || to === "/admin"}
            className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}
          >
            <Icon size={18} strokeWidth={1.8} />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-bottom">
        <div className="sidebar-user">
          <div className="sidebar-avatar">
            {user?.name?.charAt(0)?.toUpperCase() || "U"}
          </div>

          <div className="sidebar-user-info">
            <strong>{user?.name || "User"}</strong>
            <span>{isAdmin ? "Administrator" : "Resident"}</span>
          </div>
        </div>

        <button type="button" className="logout-button" onClick={logout}>
          <LogOut size={17} strokeWidth={1.8} />
          <span>Sign out</span>
        </button>
      </div>
    </aside>
  );
}
