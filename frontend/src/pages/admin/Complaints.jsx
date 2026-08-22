import {
  AlertTriangle,
  ChevronRight,
  Filter,
  Search,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { getAdminComplaints } from "../../api/admin";

const STATUS_OPTIONS = [
  { value: "", label: "All statuses" },
  { value: "open", label: "Open" },
  {
    value: "in_progress",
    label: "In progress",
  },
  { value: "resolved", label: "Resolved" },
];

const PRIORITY_OPTIONS = [
  { value: "", label: "All priorities" },
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
];

function formatDate(value) {
  if (!value) return "—";

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function formatStatus(status) {
  return status.replace("_", " ");
}

export default function AdminComplaints() {
  const navigate = useNavigate();

  const [complaints, setComplaints] = useState([]);

  const [status, setStatus] = useState("");
  const [priority, setPriority] = useState("");

  const [search, setSearch] = useState("");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadComplaints() {
      try {
        setLoading(true);
        setError("");

        const params = {
          limit: 100,
        };

        if (status) {
          params.status = status;
        }

        if (priority) {
          params.priority = priority;
        }

        const data = await getAdminComplaints(params);

        setComplaints(data);
      } catch (err) {
        console.error(err);

        setError(
          err.response?.data?.detail ||
            "Unable to load complaints.",
        );
      } finally {
        setLoading(false);
      }
    }

    loadComplaints();
  }, [status, priority]);

  const filteredComplaints = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) {
      return complaints;
    }

    return complaints.filter((complaint) => {
      return (
        complaint.category
          .toLowerCase()
          .includes(query) ||
        complaint.description
          .toLowerCase()
          .includes(query) ||
        String(complaint.resident_id).includes(query)
      );
    });
  }, [complaints, search]);

  return (
    <div className="admin-page">
      <div className="page-heading">
        <div>
          <p className="eyebrow">
            Administration
          </p>

          <h2>Complaints</h2>

          <p className="page-description">
            Review and manage complaints reported
            by residents.
          </p>
        </div>
      </div>

      <div className="admin-complaints-toolbar">
        <div className="admin-search">
          <Search size={15} />

          <input
            type="search"
            placeholder="Search complaints..."
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
          />
        </div>

        <div className="admin-filter">
          <Filter size={14} />

          <select
            value={status}
            onChange={(event) =>
              setStatus(event.target.value)
            }
          >
            {STATUS_OPTIONS.map((option) => (
              <option
                key={option.value}
                value={option.value}
              >
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className="admin-filter">
          <select
            value={priority}
            onChange={(event) =>
              setPriority(event.target.value)
            }
          >
            {PRIORITY_OPTIONS.map((option) => (
              <option
                key={option.value}
                value={option.value}
              >
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {loading && (
        <div className="admin-list-state">
          Loading complaints...
        </div>
      )}

      {!loading && error && (
        <div className="admin-list-state error">
          <AlertTriangle size={17} />
          {error}
        </div>
      )}

      {!loading &&
        !error &&
        filteredComplaints.length === 0 && (
          <div className="admin-list-state">
            No complaints match your filters.
          </div>
        )}

      {!loading &&
        !error &&
        filteredComplaints.length > 0 && (
          <div className="admin-complaints-list">
            <div className="admin-list-header">
              <span>Complaint</span>
              <span>Resident</span>
              <span>Status</span>
              <span>Priority</span>
              <span>Date</span>
              <span />
            </div>

            {filteredComplaints.map(
              (complaint) => (
                <button
                  type="button"
                  key={complaint.id}
                  className={`admin-complaint-row ${
                    complaint.is_overdue
                      ? "overdue"
                      : ""
                  }`}
                  onClick={() =>
                    navigate(
                      `/admin/complaints/${complaint.id}`,
                    )
                  }
                >
                  <div className="admin-complaint-main">
                    <div className="admin-complaint-category">
                      {complaint.category}
                    </div>

                    <p>
                      {complaint.description}
                    </p>

                    {complaint.is_overdue && (
                      <span className="overdue-label">
                        <AlertTriangle size={11} />
                        Overdue
                      </span>
                    )}
                  </div>

                  <div className="admin-resident-id">
                    #{complaint.resident_id}
                  </div>

                  <div>
                    <span
                      className={`status-pill ${complaint.status}`}
                    >
                      {formatStatus(
                        complaint.status,
                      )}
                    </span>
                  </div>

                  <div>
                    <span
                      className={`priority-pill ${complaint.priority}`}
                    >
                      {complaint.priority}
                    </span>
                  </div>

                  <div className="admin-complaint-date">
                    {formatDate(
                      complaint.created_at,
                    )}
                  </div>

                  <ChevronRight size={15} />
                </button>
              ),
            )}
          </div>
        )}
    </div>
  );
}