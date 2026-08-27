import {
  AlertCircle,
  ArrowLeft,
  Bell,
  CalendarDays,
} from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { useEffect, useState } from "react";

import { getNotice } from "../../api/notices";

function formatDate(value) {
  if (!value) return "";

  return new Date(value).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
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

export default function NoticeDetail() {
  const { noticeId } = useParams();

  const [notice, setNotice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadNotice() {
      try {
        setLoading(true);
        setError("");

        const data = await getNotice(noticeId);

        setNotice(data);
      } catch (err) {
        console.error(err);

        setError(
          "We couldn't load this notice. Please try again.",
        );
      } finally {
        setLoading(false);
      }
    }

    loadNotice();
  }, [noticeId]);

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="loading-spinner" />
        Loading notice...
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard-error">
        <div>
          <strong>Unable to load notice</strong>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  if (!notice) {
    return (
      <div className="empty-state">
        <strong>Notice not found</strong>

        <p>
          This notice may have been removed.
        </p>

        <Link
          to="/notices"
          className="secondary-button"
        >
          Back to notices
        </Link>
      </div>
    );
  }

  return (
    <div className="notice-detail-page">
      <Link
        to="/notices"
        className="back-link"
      >
        <ArrowLeft size={15} />
        Back to notices
      </Link>

      <article className="notice-detail-card">
        <div
          className={
            notice.is_important
              ? "notice-detail-accent important"
              : "notice-detail-accent"
          }
        />

        <div className="notice-detail-body">
          <div className="notice-detail-meta">
            <span
              className={
                notice.is_important
                  ? "notice-type important"
                  : "notice-type"
              }
            >
              {notice.is_important ? (
                <>
                  <AlertCircle size={13} />
                  Important
                </>
              ) : (
                <>
                  <Bell size={13} />
                  Announcement
                </>
              )}
            </span>

            <span>
              {formatDate(notice.created_at)}
            </span>
          </div>

          <h2>{notice.title}</h2>

          <div className="notice-detail-divider" />

          <div className="notice-detail-content">
            {notice.content
              .split("\n")
              .map((paragraph, index) => (
                <p key={index}>
                  {paragraph || "\u00A0"}
                </p>
              ))}
          </div>

          <div className="notice-detail-footer">
            <CalendarDays size={15} />

            <span>
              Posted{" "}
              {formatDateTime(
                notice.created_at,
              )}
            </span>
          </div>
        </div>
      </article>
    </div>
  );
}