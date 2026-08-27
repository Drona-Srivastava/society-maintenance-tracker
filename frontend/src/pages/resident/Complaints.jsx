import {
  ClipboardList,
  Plus,
} from "lucide-react";
import { Link } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";

import { getComplaints } from "../../api/complaints";

const FILTERS = [
  { key: "all", label: "All" },
  { key: "open", label: "Open" },
  { key: "in_progress", label: "In Progress" },
  { key: "resolved", label: "Resolved" },
];

function formatStatus(status) {
  return status
    ?.replace("_", " ")
    .toLowerCase();
}

function formatDate(value) {
  if (!value) return "";

  return new Date(value).toLocaleDateString(
    "en-IN",
    {
      day: "numeric",
      month: "short",
      year: "numeric",
    },
  );
}

function ComplaintCard({ complaint }) {
  return (
    <Link
      to={`/complaints/${complaint.id}`}
      className="complaint-card"
    >
      <div className="complaint-card-main">
        <div className="complaint-card-heading">
          <span className="complaint-category">
            {complaint.category}
          </span>

          <span
            className={`status-badge status-${complaint.status}`}
          >
            {formatStatus(complaint.status)}
          </span>
        </div>

        <p className="complaint-description">
          {complaint.description}
        </p>

        <div className="complaint-meta">
          <span>
            Complaint #{complaint.id}
          </span>

          <span>·</span>

          <span>
            {formatDate(complaint.created_at)}
          </span>
        </div>
      </div>
    </Link>
  );
}

export default function Complaints() {
  const [complaints, setComplaints] = useState([]);
  const [filter, setFilter] = useState("all");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadComplaints() {
      try {
        setLoading(true);
        setError("");

        const data = await getComplaints();

        setComplaints(data);
      } catch (err) {
        console.error(err);

        setError(
          "We couldn't load your complaints. Please try again.",
        );
      } finally {
        setLoading(false);
      }
    }

    loadComplaints();
  }, []);

  const filteredComplaints = useMemo(() => {
    if (filter === "all") {
      return complaints;
    }

    return complaints.filter(
      (complaint) =>
        complaint.status === filter,
    );
  }, [complaints, filter]);

  return (
    <div className="complaints-page">
      <div className="page-heading">
        <div>
          <p className="eyebrow">
            Maintenance requests
          </p>

          <h2>Your complaints</h2>

          <p className="page-description">
            Track the maintenance issues you've
            reported to your society.
          </p>
        </div>

        <Link
          to="/complaints/new"
          className="primary-button"
        >
          <Plus size={16} />
          New Complaint
        </Link>
      </div>

      <div className="complaint-filters">
        {FILTERS.map((item) => (
          <button
            key={item.key}
            type="button"
            className={
              filter === item.key
                ? "filter-button active"
                : "filter-button"
            }
            onClick={() => setFilter(item.key)}
          >
            {item.label}

            {item.key === "all" && (
              <span>{complaints.length}</span>
            )}
          </button>
        ))}
      </div>

      {loading && (
        <div className="dashboard-panel">
          <div className="dashboard-loading">
            <div className="loading-spinner" />
            Loading your complaints...
          </div>
        </div>
      )}

      {!loading && error && (
        <div className="dashboard-error">
          <div>
            <strong>Something went wrong</strong>
            <p>{error}</p>
          </div>
        </div>
      )}

      {!loading &&
        !error &&
        filteredComplaints.length === 0 && (
          <div className="dashboard-panel">
            <div className="empty-state">
              <ClipboardList
                size={28}
                strokeWidth={1.5}
              />

              <strong>
                {filter === "all"
                  ? "No complaints yet"
                  : `No ${formatStatus(filter)} complaints`}
              </strong>

              <p>
                {filter === "all"
                  ? "If something needs attention in your society, you can report it here."
                  : "There are no complaints matching this status."}
              </p>

              {filter === "all" && (
                <Link
                  to="/complaints/new"
                  className="secondary-button"
                >
                  Submit a complaint
                </Link>
              )}
            </div>
          </div>
        )}

      {!loading &&
        !error &&
        filteredComplaints.length > 0 && (
          <div className="complaints-list">
            {filteredComplaints.map(
              (complaint) => (
                <ComplaintCard
                  key={complaint.id}
                  complaint={complaint}
                />
              ),
            )}
          </div>
        )}
    </div>
  );
}