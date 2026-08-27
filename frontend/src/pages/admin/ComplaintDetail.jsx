import {
  AlertTriangle,
  ArrowLeft,
  CalendarDays,
  Check,
  Clock3,
  FileText,
  Image as ImageIcon,
  MessageSquare,
  UserRound,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import {
  getAdminComplaintHistory,
  getAdminComplaints,
  updateAdminComplaint,
} from "../../api/admin";

import { getComplaintPhoto } from "../../api/complaints";

function formatDate(value) {
  if (!value) return "—";

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function formatStatus(status) {
  if (!status) return "—";

  return status
    .replace("_", " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function formatPriority(priority) {
  if (!priority) return "—";

  return (
    priority.charAt(0).toUpperCase() +
    priority.slice(1)
  );
}

export default function AdminComplaintDetail() {
  const { complaintId } = useParams();
  const navigate = useNavigate();

  const [complaint, setComplaint] = useState(null);
  const [history, setHistory] = useState([]);
  const [photoUrl, setPhotoUrl] = useState(null);

  const [status, setStatus] = useState("");
  const [priority, setPriority] = useState("");
  const [note, setNote] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const loadComplaint = async () => {
    try {
      setLoading(true);
      setError("");

      const complaints = await getAdminComplaints({
        limit: 100,
      });

      const found = complaints.find(
        (item) =>
          String(item.id) === String(complaintId),
      );

      if (!found) {
        setError("Complaint not found.");
        return;
      }

      setComplaint(found);
      setStatus(found.status);
      setPriority(found.priority);

      const historyData =
        await getAdminComplaintHistory(complaintId);

      setHistory(historyData);
    } catch (err) {
      console.error(err);

      setError(
        err.response?.data?.detail ||
          "Unable to load this complaint.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadComplaint();
  }, [complaintId]);

  useEffect(() => {
    let objectUrl = null;
    let cancelled = false;

    async function loadPhoto() {
      if (!complaint?.photo_url) {
        setPhotoUrl(null);
        return;
      }

      try {
        objectUrl = await getComplaintPhoto(
          complaint.id,
        );

        if (cancelled) {
          URL.revokeObjectURL(objectUrl);
          return;
        }

        setPhotoUrl(objectUrl);
      } catch (err) {
        console.error(
          "Unable to load complaint photo",
          err,
        );

        if (!cancelled) {
          setPhotoUrl(null);
        }
      }
    }

    loadPhoto();

    return () => {
      cancelled = true;

      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [complaint]);

  const statusOptions = useMemo(() => {
    if (!complaint) return [];

    const current = complaint.status;

    if (current === "open") {
      return [
        {
          value: "open",
          label: "Open",
        },
        {
          value: "in_progress",
          label: "In progress",
        },
      ];
    }

    if (current === "in_progress") {
      return [
        {
          value: "in_progress",
          label: "In progress",
        },
        {
          value: "open",
          label: "Open",
        },
        {
          value: "resolved",
          label: "Resolved",
        },
      ];
    }

    return [
      {
        value: "resolved",
        label: "Resolved",
      },
      {
        value: "open",
        label: "Open",
      },
    ];
  }, [complaint]);

  const handleSave = async (event) => {
    event.preventDefault();

    const payload = {};

    if (status !== complaint.status) {
      payload.status = status;
    }

    if (priority !== complaint.priority) {
      payload.priority = priority;
    }

    if (note.trim()) {
      payload.note = note.trim();
    }

    if (Object.keys(payload).length === 0) {
      setError("There are no changes to save.");
      return;
    }

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      const updated =
        await updateAdminComplaint(
          complaint.id,
          payload,
        );

      setComplaint(updated);
      setStatus(updated.status);
      setPriority(updated.priority);
      setNote("");

      const historyData =
        await getAdminComplaintHistory(
          complaint.id,
        );

      setHistory(historyData);

      setSuccess(
        "Complaint updated successfully.",
      );
    } catch (err) {
      console.error(err);

      setError(
        err.response?.data?.detail ||
          "Unable to update the complaint.",
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="admin-page">
        <div className="admin-list-state">
          Loading complaint...
        </div>
      </div>
    );
  }

  if (error && !complaint) {
    return (
      <div className="admin-page">
        <button
          type="button"
          className="back-button"
          onClick={() =>
            navigate("/admin/complaints")
          }
        >
          <ArrowLeft size={15} />
          Back to complaints
        </button>

        <div className="admin-list-state error">
          <AlertTriangle size={17} />
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="admin-page admin-detail-page">
      <button
        type="button"
        className="back-button"
        onClick={() =>
          navigate("/admin/complaints")
        }
      >
        <ArrowLeft size={15} />
        Back to complaints
      </button>

      <div className="admin-detail-heading">
        <div>
          <p className="eyebrow">
            Complaint #{complaint.id}
          </p>

          <h2>{complaint.category}</h2>

          <p className="page-description">
            Reported by resident #{complaint.resident_id}
          </p>
        </div>

        {complaint.is_overdue && (
          <div className="detail-overdue">
            <AlertTriangle size={14} />
            Overdue
          </div>
        )}
      </div>

      <div className="admin-detail-grid">
        <main>
          <section className="admin-detail-card">
            <div className="detail-card-heading">
              <div className="detail-heading-icon">
                <FileText size={16} />
              </div>

              <div>
                <h3>Complaint details</h3>
                <p>
                  Information submitted by the resident.
                </p>
              </div>
            </div>

            <div className="complaint-description">
              {complaint.description}
            </div>

            {complaint.photo_url && photoUrl && (
              <div className="complaint-photo-section">
                <div className="detail-subheading">
                  <ImageIcon size={14} />
                  Attached image
                </div>

                <a
                  href={photoUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="complaint-image-link"
                >
                  <img
                    src={photoUrl}
                    alt="Complaint attachment"
                    className="complaint-detail-image"
                  />
                </a>
              </div>
            )}
          </section>

          <section className="admin-detail-card">
            <div className="detail-card-heading">
              <div className="detail-heading-icon">
                <Clock3 size={16} />
              </div>

              <div>
                <h3>Complaint history</h3>
                <p>
                  Audit trail of changes and notes.
                </p>
              </div>
            </div>

            {history.length === 0 ? (
              <div className="empty-history">
                No history available.
              </div>
            ) : (
              <div className="history-list">
                {history.map((item) => (
                  <div
                    className="history-item"
                    key={item.id}
                  >
                    <div className="history-marker" />

                    <div className="history-content">
                      <div className="history-top">
                        <strong>
                          {item.note ||
                            "Complaint updated"}
                        </strong>

                        <span>
                          {formatDate(
                            item.created_at,
                          )}
                        </span>
                      </div>

                      <div className="history-meta">
                        <UserRound size={11} />

                        Admin / User #
                        {item.actor_id}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </main>

        <aside>
          <form
            className="admin-detail-card update-card"
            onSubmit={handleSave}
          >
            <div className="detail-card-heading">
              <div className="detail-heading-icon">
                <MessageSquare size={16} />
              </div>

              <div>
                <h3>Manage complaint</h3>
                <p>
                  Update its current state.
                </p>
              </div>
            </div>

            <div className="detail-field">
              <label htmlFor="complaint-status">
                Status
              </label>

              <select
                id="complaint-status"
                value={status}
                onChange={(event) =>
                  setStatus(event.target.value)
                }
                disabled={saving}
              >
                {statusOptions.map((option) => (
                  <option
                    key={option.value}
                    value={option.value}
                  >
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="detail-field">
              <label htmlFor="complaint-priority">
                Priority
              </label>

              <select
                id="complaint-priority"
                value={priority}
                onChange={(event) =>
                  setPriority(event.target.value)
                }
                disabled={saving}
              >
                <option value="low">Low</option>
                <option value="medium">
                  Medium
                </option>
                <option value="high">High</option>
              </select>
            </div>

            <div className="detail-field">
              <label htmlFor="admin-note">
                Admin note
              </label>

              <textarea
                id="admin-note"
                value={note}
                onChange={(event) =>
                  setNote(event.target.value)
                }
                placeholder="Add a note about this update..."
                maxLength={1000}
                rows={5}
                disabled={saving}
              />

              <span className="field-hint">
                {note.length}/1000
              </span>
            </div>

            {(error || success) && (
              <div
                className={
                  error
                    ? "profile-message error"
                    : "profile-message success"
                }
              >
                {success && <Check size={14} />}
                {error || success}
              </div>
            )}

            <button
              type="submit"
              className="primary-button detail-save-button"
              disabled={saving}
            >
              {saving
                ? "Saving..."
                : "Save changes"}
            </button>
          </form>

          <section className="admin-detail-card metadata-card">
            <div className="detail-card-heading">
              <div className="detail-heading-icon">
                <CalendarDays size={16} />
              </div>

              <div>
                <h3>Timeline</h3>
                <p>Complaint timestamps.</p>
              </div>
            </div>

            <div className="metadata-row">
              <span>Created</span>
              <strong>
                {formatDate(
                  complaint.created_at,
                )}
              </strong>
            </div>

            <div className="metadata-row">
              <span>Last updated</span>
              <strong>
                {formatDate(
                  complaint.updated_at,
                )}
              </strong>
            </div>

            <div className="metadata-row">
              <span>Resolved</span>
              <strong>
                {formatDate(
                  complaint.resolved_at,
                )}
              </strong>
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}