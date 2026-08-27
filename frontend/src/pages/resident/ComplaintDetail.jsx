import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  Clock3,
  FileImage,
} from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { useEffect, useState } from "react";

import {
  getComplaint,
  getComplaintHistory,
  getComplaintPhoto,
} from "../../api/complaints";

function formatStatus(status) {
  return status?.replace("_", " ").toLowerCase();
}

function formatDate(value) {
  if (!value) return "—";

  return new Date(value).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatDateTime(value) {
  if (!value) return "";

  return new Date(value).toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function getStatusClass(status) {
  return `status-badge status-${status}`;
}

function HistoryIcon({ status }) {
  if (status === "resolved") {
    return <CheckCircle2 size={16} />;
  }

  if (status === "in_progress") {
    return <Clock3 size={16} />;
  }

  return <Clock3 size={16} />;
}

export default function ComplaintDetail() {
  const { complaintId } = useParams();

  const [complaint, setComplaint] = useState(null);
  const [history, setHistory] = useState([]);
  const [photoUrl, setPhotoUrl] = useState(null);

  const [loading, setLoading] = useState(true);
  const [photoLoading, setPhotoLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadComplaint() {
      try {
        setLoading(true);
        setError("");

        const [complaintData, historyData] =
          await Promise.all([
            getComplaint(complaintId),
            getComplaintHistory(complaintId),
          ]);

        if (cancelled) return;

        setComplaint(complaintData);

        setHistory(
          Array.isArray(historyData)
            ? historyData
            : historyData.items || [],
        );
      } catch (err) {
        console.error(err);

        if (!cancelled) {
          setError(
            "We couldn't load this complaint. Please try again.",
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadComplaint();

    return () => {
      cancelled = true;
    };
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
        setPhotoLoading(true);

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
          "Unable to load complaint photo:",
          err,
        );

        if (!cancelled) {
          setPhotoUrl(null);
        }
      } finally {
        if (!cancelled) {
          setPhotoLoading(false);
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

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="loading-spinner" />
        Loading complaint...
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard-error">
        <div>
          <strong>Unable to load complaint</strong>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  if (!complaint) {
    return (
      <div className="empty-state">
        <strong>Complaint not found</strong>

        <p>
          This complaint may have been removed or
          you may not have access to it.
        </p>

        <Link
          to="/complaints"
          className="secondary-button"
        >
          Back to complaints
        </Link>
      </div>
    );
  }

  return (
    <div className="complaint-detail-page">
      <Link
        to="/complaints"
        className="back-link"
      >
        <ArrowLeft size={15} />
        Back to complaints
      </Link>

      <div className="detail-header">
        <div>
          <div className="detail-title-row">
            <span className="detail-category">
              {complaint.category}
            </span>

            <span
              className={getStatusClass(
                complaint.status,
              )}
            >
              {formatStatus(complaint.status)}
            </span>
          </div>

          <h2>Complaint #{complaint.id}</h2>

          <p className="detail-description">
            {complaint.description}
          </p>
        </div>
      </div>

      <div className="detail-layout">
        <div className="detail-main">
          <section className="detail-panel">
            <div className="detail-panel-heading">
              <div>
                <h3>Complaint details</h3>

                <p>
                  Information about your maintenance
                  request.
                </p>
              </div>
            </div>

            <div className="detail-info-grid">
              <div className="detail-info-item">
                <span>Category</span>

                <strong>
                  {complaint.category}
                </strong>
              </div>

              <div className="detail-info-item">
                <span>Priority</span>

                <strong className="capitalize">
                  {complaint.priority || "Medium"}
                </strong>
              </div>

              <div className="detail-info-item">
                <span>Submitted</span>

                <strong>
                  {formatDate(
                    complaint.created_at,
                  )}
                </strong>
              </div>

              <div className="detail-info-item">
                <span>Last updated</span>

                <strong>
                  {formatDate(
                    complaint.updated_at,
                  )}
                </strong>
              </div>
            </div>
          </section>

          {complaint.photo_url && (
            <section className="detail-panel">
              <div className="detail-panel-heading">
                <div>
                  <h3>Attachment</h3>

                  <p>
                    Photo attached to this complaint.
                  </p>
                </div>

                <FileImage
                  size={18}
                  strokeWidth={1.7}
                />
              </div>

              {photoLoading && (
                <div className="detail-empty">
                  <Clock3 size={19} />
                  <span>
                    Loading attachment...
                  </span>
                </div>
              )}

              {!photoLoading && photoUrl && (
                <div className="complaint-image-wrapper">
                  <img
                    src={photoUrl}
                    alt="Complaint attachment"
                    className="complaint-image"
                  />
                </div>
              )}

              {!photoLoading && !photoUrl && (
                <div className="detail-empty">
                  <FileImage size={19} />
                  <span>
                    Unable to load attachment.
                  </span>
                </div>
              )}
            </section>
          )}

          <section className="detail-panel">
            <div className="detail-panel-heading">
              <div>
                <h3>Complaint history</h3>

                <p>
                  Updates made to this maintenance
                  request.
                </p>
              </div>
            </div>

            {history.length === 0 ? (
              <div className="detail-empty">
                <Clock3 size={19} />

                <span>
                  No history updates yet.
                </span>
              </div>
            ) : (
              <div className="history-list">
                {history.map((item, index) => (
                  <div
                    className="history-item"
                    key={
                      item.id ??
                      `${item.created_at}-${index}`
                    }
                  >
                    <div className="history-icon">
                      <HistoryIcon
                        status={item.status}
                      />
                    </div>

                    <div className="history-content">
                      <strong>
                        {item.status
                          ? `Status changed to ${formatStatus(item.status)}`
                          : "Complaint updated"}
                      </strong>

                      <p>
                        {item.comment ||
                          item.description ||
                          "Complaint history updated."}
                      </p>

                      <span>
                        {formatDateTime(
                          item.created_at,
                        )}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        <aside className="detail-sidebar">
          <div className="detail-panel status-panel">
            <span className="detail-sidebar-label">
              Current status
            </span>

            <span
              className={getStatusClass(
                complaint.status,
              )}
            >
              {formatStatus(complaint.status)}
            </span>

            <p>
              {complaint.status === "resolved"
                ? "This complaint has been marked as resolved."
                : complaint.status === "in_progress"
                  ? "Your complaint is currently being handled."
                  : "Your complaint is waiting for action."}
            </p>
          </div>

          <div className="detail-panel">
            <div className="detail-sidebar-item">
              <CalendarDays size={16} />

              <div>
                <span>Submitted</span>

                <strong>
                  {formatDate(
                    complaint.created_at,
                  )}
                </strong>
              </div>
            </div>

            {complaint.resolved_at && (
              <div className="detail-sidebar-item">
                <CheckCircle2 size={16} />

                <div>
                  <span>Resolved</span>

                  <strong>
                    {formatDate(
                      complaint.resolved_at,
                    )}
                  </strong>
                </div>
              </div>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}