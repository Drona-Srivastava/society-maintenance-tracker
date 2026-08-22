import {
  AlertCircle,
  ArrowUpRight,
  Bell,
  ChevronRight,
} from "lucide-react";
import { Link } from "react-router-dom";
import { useEffect, useState } from "react";

import { getNotices } from "../../api/notices";

function formatDate(value) {
  if (!value) return "";

  return new Date(value).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function truncate(text, length = 150) {
  if (!text || text.length <= length) {
    return text;
  }

  return `${text.slice(0, length).trim()}...`;
}

export default function Notices() {
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadNotices() {
      try {
        setLoading(true);
        setError("");

        const data = await getNotices();

        setNotices(data);
      } catch (err) {
        console.error(err);

        setError(
          "We couldn't load the notices. Please try again.",
        );
      } finally {
        setLoading(false);
      }
    }

    loadNotices();
  }, []);

  const importantNotices = notices.filter(
    (notice) => notice.is_important,
  );

  const regularNotices = notices.filter(
    (notice) => !notice.is_important,
  );

  return (
    <div className="notices-page">
      <div className="page-heading">
        <div>
          <p className="eyebrow">Community updates</p>

          <h2>Notices</h2>

          <p className="page-description">
            Stay up to date with announcements and
            important information from your society.
          </p>
        </div>
      </div>

      {loading && (
        <div className="dashboard-panel">
          <div className="dashboard-loading">
            <div className="loading-spinner" />
            Loading notices...
          </div>
        </div>
      )}

      {!loading && error && (
        <div className="dashboard-error">
          <AlertCircle size={18} />

          <div>
            <strong>Something went wrong</strong>
            <p>{error}</p>
          </div>
        </div>
      )}

      {!loading &&
        !error &&
        notices.length === 0 && (
          <div className="dashboard-panel">
            <div className="empty-state">
              <Bell
                size={28}
                strokeWidth={1.5}
              />

              <strong>No notices yet</strong>

              <p>
                There aren't any community
                announcements at the moment.
              </p>
            </div>
          </div>
        )}

      {!loading &&
        !error &&
        notices.length > 0 && (
          <div className="notices-content">
            {importantNotices.length > 0 && (
              <section className="notice-section">
                <div className="section-label">
                  <span>Important</span>
                </div>

                <div className="notice-list-page">
                  {importantNotices.map(
                    (notice) => (
                      <Link
                        key={notice.id}
                        to={`/notices/${notice.id}`}
                        className="notice-card important"
                      >
                        <div className="notice-card-icon">
                          <AlertCircle
                            size={17}
                            strokeWidth={1.8}
                          />
                        </div>

                        <div className="notice-card-content">
                          <div className="notice-card-top">
                            <span className="important-label">
                              Important
                            </span>

                            <span>
                              {formatDate(
                                notice.created_at,
                              )}
                            </span>
                          </div>

                          <h3>{notice.title}</h3>

                          <p>
                            {truncate(
                              notice.content,
                            )}
                          </p>
                        </div>

                        <ArrowUpRight
                          className="notice-card-arrow"
                          size={17}
                        />
                      </Link>
                    ),
                  )}
                </div>
              </section>
            )}

            {regularNotices.length > 0 && (
              <section className="notice-section">
                <div className="section-label">
                  <span>Recent announcements</span>
                </div>

                <div className="notice-list-page">
                  {regularNotices.map(
                    (notice) => (
                      <Link
                        key={notice.id}
                        to={`/notices/${notice.id}`}
                        className="notice-card"
                      >
                        <div className="notice-card-icon regular">
                          <Bell
                            size={17}
                            strokeWidth={1.7}
                          />
                        </div>

                        <div className="notice-card-content">
                          <div className="notice-card-top">
                            <span>
                              Announcement
                            </span>

                            <span>
                              {formatDate(
                                notice.created_at,
                              )}
                            </span>
                          </div>

                          <h3>{notice.title}</h3>

                          <p>
                            {truncate(
                              notice.content,
                            )}
                          </p>
                        </div>

                        <ChevronRight
                          className="notice-card-arrow"
                          size={17}
                        />
                      </Link>
                    ),
                  )}
                </div>
              </section>
            )}
          </div>
        )}
    </div>
  );
}