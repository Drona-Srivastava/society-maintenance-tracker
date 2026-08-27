import { useEffect, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Clock3,
  FileText,
  Plus,
} from "lucide-react";
import { Link } from "react-router-dom";

import { getDashboard } from "../../api/dashboard";

export default function ResidentDashboard() {
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadDashboard() {
      try {
        setLoading(true);
        setError("");

        const data = await getDashboard();

        console.log("Dashboard response:", data);

        setDashboard(data);
      } catch (err) {
        console.error("Dashboard request failed:", err);

        setError(
          err.response?.data?.detail ||
            "Unable to load your dashboard.",
        );
      } finally {
        setLoading(false);
      }
    }

    loadDashboard();
  }, []);

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="loading-spinner" />
        <p>Loading your dashboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard-error">
        <AlertCircle size={22} />
        <div>
          <strong>Unable to load dashboard</strong>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  const complaints = dashboard?.complaints ?? {};

  return (
    <div className="dashboard">
      <section className="page-heading">
        <div>
          <p className="eyebrow">Resident Portal</p>
          <h2>Dashboard</h2>
          <p className="page-description">
            Keep track of your maintenance requests and society
            announcements.
          </p>
        </div>

        <Link to="/complaints/new" className="primary-button">
          <Plus size={18} />
          New Complaint
        </Link>
      </section>

      <section className="stats-grid">
        <div className="stat-card">
          <div className="stat-card-top">
            <span>Total Complaints</span>
            <FileText size={20} />
          </div>

          <strong>{complaints.total ?? 0}</strong>

          <p>Your submitted complaints</p>
        </div>

        <div className="stat-card">
          <div className="stat-card-top">
            <span>Open</span>
            <Clock3 size={20} />
          </div>

          <strong>{complaints.open ?? 0}</strong>

          <p>Waiting for action</p>
        </div>

        <div className="stat-card">
          <div className="stat-card-top">
            <span>In Progress</span>
            <Clock3 size={20} />
          </div>

          <strong>{complaints.in_progress ?? 0}</strong>

          <p>Currently being handled</p>
        </div>

        <div className="stat-card">
          <div className="stat-card-top">
            <span>Resolved</span>
            <CheckCircle2 size={20} />
          </div>

          <strong>{complaints.resolved ?? 0}</strong>

          <p>Successfully resolved</p>
        </div>
      </section>

      <section className="dashboard-grid">
        <div className="dashboard-panel">
          <div className="panel-heading">
            <div>
              <h3>Recent Complaints</h3>
              <p>Your latest maintenance requests</p>
            </div>

            <Link to="/complaints">View all</Link>
          </div>

          {dashboard?.recent_complaints?.length > 0 ? (
            <div className="complaint-list">
              {dashboard.recent_complaints.map((complaint) => (
                <div
                  className="complaint-row"
                  key={complaint.id}
                >
                  <div>
                    <strong>{complaint.category}</strong>
                    <p>{complaint.description}</p>
                  </div>

                  <span
                    className={`status-badge status-${complaint.status}`}
                  >
                    {complaint.status.replace("_", " ")}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <FileText size={30} />
              <strong>No complaints yet</strong>
              <p>
                You haven't submitted any maintenance complaints.
              </p>

              <Link
                to="/complaints/new"
                className="secondary-button"
              >
                Submit a complaint
              </Link>
            </div>
          )}
        </div>

        <div className="dashboard-panel">
          <div className="panel-heading">
            <div>
              <h3>Important Notices</h3>
              <p>Updates from your society</p>
            </div>

            <Link to="/notices">View all</Link>
          </div>

          {dashboard?.important_notices?.length > 0 ? (
            <div className="notice-list">
              {dashboard.important_notices.map((notice) => (
                <div className="notice-item" key={notice.id}>
                  <div className="notice-indicator" />

                  <div>
                    <strong>{notice.title}</strong>
                    <p>{notice.content}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <AlertCircle size={30} />
              <strong>No important notices</strong>
              <p>There are no important announcements right now.</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}