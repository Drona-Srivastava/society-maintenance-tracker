import {
  AlertCircle,
  Bell,
  Check,
  Edit3,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";

import {
  createAdminNotice,
  deleteAdminNotice,
  getAdminNotices,
  updateAdminNotice,
} from "../../api/admin";

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

const EMPTY_FORM = {
  title: "",
  content: "",
  is_important: false,
};

export default function Notices() {
  const [notices, setNotices] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showEditor, setShowEditor] = useState(false);
  const [editingNotice, setEditingNotice] = useState(null);

  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  async function loadNotices() {
    try {
      setLoading(true);
      setError("");

      const data = await getAdminNotices();

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

  useEffect(() => {
    loadNotices();
  }, []);

  function openCreate() {
    setEditingNotice(null);
    setForm(EMPTY_FORM);
    setShowEditor(true);
  }

  function openEdit(notice) {
    setEditingNotice(notice);

    setForm({
      title: notice.title,
      content: notice.content,
      is_important: notice.is_important,
    });

    setShowEditor(true);
  }

  function closeEditor() {
    if (saving) return;

    setShowEditor(false);
    setEditingNotice(null);
    setForm(EMPTY_FORM);
  }

  function handleChange(event) {
    const { name, value, type, checked } =
      event.target;

    setForm((prev) => ({
      ...prev,
      [name]:
        type === "checkbox"
          ? checked
          : value,
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (!form.title.trim() || !form.content.trim()) {
      setError(
        "Title and content are required.",
      );
      return;
    }

    try {
      setSaving(true);
      setError("");

      const payload = {
        title: form.title.trim(),
        content: form.content.trim(),
        is_important: form.is_important,
      };

      if (editingNotice) {
        const updated =
          await updateAdminNotice(
            editingNotice.id,
            payload,
          );

        setNotices((prev) =>
          prev.map((notice) =>
            notice.id === updated.id
              ? updated
              : notice,
          ),
        );
      } else {
        const created =
          await createAdminNotice(payload);

        setNotices((prev) => [
          created,
          ...prev,
        ]);
      }

      closeEditor();
    } catch (err) {
      console.error(err);

      setError(
        "We couldn't save the notice. Please try again.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return;

    try {
      setDeleting(true);

      await deleteAdminNotice(deleteTarget.id);

      setNotices((prev) =>
        prev.filter(
          (notice) =>
            notice.id !== deleteTarget.id,
        ),
      );

      setDeleteTarget(null);
    } catch (err) {
      console.error(err);

      setError(
        "We couldn't delete the notice. Please try again.",
      );
    } finally {
      setDeleting(false);
    }
  }

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
          <p className="eyebrow">
            Community communication
          </p>

          <h2>Notices</h2>

          <p className="page-description">
            Create and manage announcements for residents.
          </p>
        </div>

        <button
          className="primary-button"
          onClick={openCreate}
        >
          <Plus size={17} />
          New notice
        </button>
      </div>

      {error && (
        <div className="dashboard-error">
          <AlertCircle size={18} />

          <div>
            <strong>Something went wrong</strong>
            <p>{error}</p>
          </div>
        </div>
      )}

      {loading ? (
        <div className="dashboard-panel">
          <div className="dashboard-loading">
            <div className="loading-spinner" />
            Loading notices...
          </div>
        </div>
      ) : (
        <div className="notices-content">
          {importantNotices.length > 0 && (
            <NoticeSection
              title="Important"
              notices={importantNotices}
              onEdit={openEdit}
              onDelete={setDeleteTarget}
            />
          )}

          {regularNotices.length > 0 && (
            <NoticeSection
              title="Recent announcements"
              notices={regularNotices}
              onEdit={openEdit}
              onDelete={setDeleteTarget}
            />
          )}

          {notices.length === 0 && (
            <div className="dashboard-panel">
              <div className="empty-state">
                <Bell size={30} strokeWidth={1.5} />

                <strong>No notices yet</strong>

                <p>
                  Create your first announcement for residents.
                </p>

                <button
                  className="primary-button"
                  onClick={openCreate}
                >
                  <Plus size={17} />
                  Create notice
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {showEditor && (
        <NoticeEditorModal
          editingNotice={editingNotice}
          form={form}
          saving={saving}
          onChange={handleChange}
          onClose={closeEditor}
          onSubmit={handleSubmit}
        />
      )}

      {deleteTarget && (
        <DeleteModal
          notice={deleteTarget}
          deleting={deleting}
          onCancel={() => {
            if (!deleting) {
              setDeleteTarget(null);
            }
          }}
          onConfirm={confirmDelete}
        />
      )}
    </div>
  );
}

function NoticeSection({
  title,
  notices,
  onEdit,
  onDelete,
}) {
  return (
    <section className="notice-section">
      <div className="section-label">
        <span>{title}</span>
      </div>

      <div className="notice-list-page">
        {notices.map((notice) => (
          <div
            key={notice.id}
            className={`notice-card ${
              notice.is_important
                ? "important"
                : ""
            }`}
          >
            <div
              className={`notice-card-icon ${
                notice.is_important
                  ? ""
                  : "regular"
              }`}
            >
              {notice.is_important ? (
                <AlertCircle size={17} />
              ) : (
                <Bell size={17} />
              )}
            </div>

            <div className="notice-card-content">
              <div className="notice-card-top">
                <span>
                  {notice.is_important
                    ? "Important"
                    : "Announcement"}
                </span>

                <span>
                  {formatDate(notice.created_at)}
                </span>
              </div>

              <h3>{notice.title}</h3>

              <p>{truncate(notice.content)}</p>
            </div>

            <div className="notice-admin-actions">
              <button
                className="icon-button"
                onClick={() => onEdit(notice)}
                title="Edit notice"
              >
                <Edit3 size={16} />
              </button>

              <button
                className="icon-button danger"
                onClick={() => onDelete(notice)}
                title="Delete notice"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function NoticeEditorModal({
  editingNotice,
  form,
  saving,
  onChange,
  onClose,
  onSubmit,
}) {
  return (
    <div className="modal-overlay">
      <div className="notice-editor-modal">
        <div className="modal-header">
          <div>
            <h2>
              {editingNotice
                ? "Edit notice"
                : "Create notice"}
            </h2>

            <p>
              {editingNotice
                ? "Update this announcement for residents."
                : "Publish a new announcement to the society."}
            </p>
          </div>

          <button
            className="icon-button"
            onClick={onClose}
            disabled={saving}
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={onSubmit}>
          <div className="modal-body">
            <label className="form-field">
              <span>Title</span>

              <input
                type="text"
                name="title"
                value={form.title}
                onChange={onChange}
                placeholder="Enter notice title"
                maxLength={200}
                required
              />
            </label>

            <label className="form-field">
              <span>Content</span>

              <textarea
                name="content"
                value={form.content}
                onChange={onChange}
                rows={9}
                placeholder="Write the notice..."
                maxLength={10000}
                required
              />
            </label>

            <label className="important-checkbox">
              <input
                type="checkbox"
                name="is_important"
                checked={form.is_important}
                onChange={onChange}
              />

              <div>
                <strong>Important notice</strong>
                <span>
                  Show this notice at the top for residents.
                </span>
              </div>
            </label>
          </div>

          <div className="modal-footer">
            <button
              type="button"
              className="secondary-button"
              onClick={onClose}
              disabled={saving}
            >
              Cancel
            </button>

            <button
              type="submit"
              className="primary-button"
              disabled={saving}
            >
              <Check size={16} />

              {saving
                ? "Saving..."
                : editingNotice
                  ? "Save changes"
                  : "Publish notice"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function DeleteModal({
  notice,
  deleting,
  onCancel,
  onConfirm,
}) {
  return (
    <div className="modal-overlay">
      <div className="delete-modal">
        <div className="delete-modal-icon">
          <Trash2 size={24} />
        </div>

        <h2>Delete notice?</h2>

        <p>
          You're about to permanently delete
          <strong> "{notice.title}"</strong>.
        </p>

        <span className="delete-warning">
          This action cannot be undone.
        </span>

        <div className="modal-footer">
          <button
            className="secondary-button"
            onClick={onCancel}
            disabled={deleting}
          >
            Cancel
          </button>

          <button
            className="danger-button"
            onClick={onConfirm}
            disabled={deleting}
          >
            <Trash2 size={16} />

            {deleting
              ? "Deleting..."
              : "Delete notice"}
          </button>
        </div>
      </div>
    </div>
  );
}