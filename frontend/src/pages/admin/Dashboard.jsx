import {
  AlertTriangle,
  Bell,
  CheckCircle2,
  ClipboardList,
  Clock3,
  FileWarning,
  Users,
} from "lucide-react";
import { useEffect, useState } from "react";

import { getAdminDashboard } from "../../api/admin";

function StatCard({
  icon: Icon,
  label,
  value,
  detail,
  className = "",
}) {
  return (
    <div className={`admin-stat-card ${className}`}>
      <div className="admin-stat-icon">
        <Icon size={17} strokeWidth={1.8} />
      </div>

      <div className="admin-stat-info">
        <span>{label}</span>
        <strong>{value}</strong>

        {detail && <small>{detail}</small>}
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadDashboard() {
      try {
        setLoading(true);
        setError("");

        const data = await getAdminDashboard();

        setDashboard(data);
      } catch (err) {
        console.error(err);

        setError(
          err.response?.data?.detail ||
            "Unable to load the admin dashboard.",
        );
      } finally {
        setLoading(false);
      }
    }

    loadDashboard();
  }, []);

  if (loading) {
    return (
      <div className="admin-page">
        <div className="dashboard-loading">
          <div className="loading-spinner" />
          Loading dashboard...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="admin-page">
        <div className="dashboard-error">
          <AlertTriangle size={18} />

          <div>
            <strong>Dashboard unavailable</strong>
            <p>{error}</p>
          </div>
        </div>
      </div>
    );
  }

  const complaints = dashboard.complaints;

  return (
    <div className="admin-page">
      <div className="page-heading">
        <div>
          <p className="eyebrow">Administration</p>

          <h2>Overview</h2>

          <p className="page-description">
            A quick view of what's happening across
            the society.
          </p>
        </div>
      </div>

      <section className="admin-stats-grid">
        <StatCard
          icon={ClipboardList}
          label="Total complaints"
          value={complaints.total}
          detail="All reported complaints"
        />

        <StatCard
          icon={Clock3}
          label="Open"
          value={complaints.open}
          detail="Awaiting action"
          className="open"
        />

        <StatCard
          icon={FileWarning}
          label="In progress"
          value={complaints.in_progress}
          detail="Currently being handled"
          className="progress"
        />

        <StatCard
          icon={CheckCircle2}
          label="Resolved"
          value={complaints.resolved}
          detail="Successfully closed"
          className="resolved"
        />

        <StatCard
          icon={AlertTriangle}
          label="Overdue"
          value={complaints.overdue}
          detail="Needs attention"
          className="overdue"
        />

        <StatCard
          icon={AlertTriangle}
          label="High priority"
          value={complaints.high_priority}
          detail="Unresolved high priority"
          className="high"
        />
      </section>

      <section className="admin-secondary-grid">
        <div className="admin-summary-card">
          <div className="admin-summary-icon">
            <Users size={18} />
          </div>

          <div>
            <span>Total residents</span>
            <strong>
              {dashboard.total_residents}
            </strong>
            <p>
              Registered residents in the society
            </p>
          </div>
        </div>

        <div className="admin-summary-card">
          <div className="admin-summary-icon">
            <Bell size={18} />
          </div>

          <div>
            <span>Total notices</span>
            <strong>
              {dashboard.total_notices}
            </strong>
            <p>
              {dashboard.important_notices}{" "}
              important{" "}
              {dashboard.important_notices === 1
                ? "notice"
                : "notices"}
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}