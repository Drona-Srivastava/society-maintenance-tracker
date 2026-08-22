import {
  ArrowLeft,
  ImagePlus,
  X,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useRef, useState } from "react";

import { createComplaint } from "../../api/complaints";

const categories = [
  "Plumbing",
  "Electrical",
  "Cleaning",
  "Security",
  "Lift",
  "Water Supply",
  "Parking",
  "Other",
];

export default function NewComplaint() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [photo, setPhoto] = useState(null);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handlePhotoChange = (event) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
    ];

    if (!allowedTypes.includes(file.type)) {
      setError(
        "Please upload a JPEG, PNG, or WebP image.",
      );

      event.target.value = "";
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError(
        "Image must be smaller than 5 MB.",
      );

      event.target.value = "";
      return;
    }

    setError("");
    setPhoto(file);
  };

  const removePhoto = () => {
    setPhoto(null);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!category) {
      setError("Please select a category.");
      return;
    }

    if (!description.trim()) {
      setError("Please describe the issue.");
      return;
    }

    try {
      setSubmitting(true);
      setError("");

      const complaint = await createComplaint({
        category,
        description: description.trim(),
        photo,
      });

      navigate(`/complaints/${complaint.id}`);
    } catch (err) {
      console.error(err);

      const message =
        err.response?.data?.detail ||
        "Unable to submit your complaint. Please try again.";

      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="new-complaint-page">
      <Link
        to="/complaints"
        className="back-link"
      >
        <ArrowLeft size={15} />
        Back to complaints
      </Link>

      <div className="form-header">
        <span className="page-eyebrow">
          MAINTENANCE REQUEST
        </span>

        <h2>Report an issue</h2>

        <p>
          Tell us what needs attention and we'll
          make sure it reaches the right people.
        </p>
      </div>

      <form
        className="complaint-form"
        onSubmit={handleSubmit}
      >
        <section className="form-panel">
          <div className="form-section-heading">
            <h3>Issue details</h3>
            <p>
              Give us enough information to
              understand the problem.
            </p>
          </div>

          <div className="form-field">
            <label htmlFor="category">
              Category
            </label>

            <select
              id="category"
              value={category}
              onChange={(event) =>
                setCategory(event.target.value)
              }
              disabled={submitting}
            >
              <option value="">
                Select a category
              </option>

              {categories.map((item) => (
                <option
                  value={item}
                  key={item}
                >
                  {item}
                </option>
              ))}
            </select>
          </div>

          <div className="form-field">
            <label htmlFor="description">
              Description
            </label>

            <textarea
              id="description"
              value={description}
              onChange={(event) =>
                setDescription(event.target.value)
              }
              placeholder="Describe what happened, where it happened, and anything else that might help..."
              rows={7}
              maxLength={2000}
              disabled={submitting}
            />

            <div className="character-count">
              {description.length}/2000
            </div>
          </div>
        </section>

        <section className="form-panel">
          <div className="form-section-heading">
            <h3>Photo</h3>
            <p>
              Optional. A photo can help the
              maintenance team understand the issue.
            </p>
          </div>

          {!photo ? (
            <button
              type="button"
              className="upload-zone"
              onClick={() =>
                fileInputRef.current?.click()
              }
              disabled={submitting}
            >
              <div className="upload-icon">
                <ImagePlus size={19} />
              </div>

              <strong>
                Add a photo
              </strong>

              <span>
                PNG, JPG or WebP · Max 5 MB
              </span>
            </button>
          ) : (
            <div className="selected-file">
              <div className="selected-file-icon">
                <ImagePlus size={17} />
              </div>

              <div className="selected-file-info">
                <strong>{photo.name}</strong>

                <span>
                  {(photo.size / 1024 / 1024).toFixed(
                    2,
                  )}{" "}
                  MB
                </span>
              </div>

              <button
                type="button"
                className="remove-file"
                onClick={removePhoto}
                disabled={submitting}
                aria-label="Remove photo"
              >
                <X size={16} />
              </button>
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handlePhotoChange}
            hidden
          />
        </section>

        {error && (
          <div className="form-error">
            {error}
          </div>
        )}

        <div className="form-actions">
          <Link
            to="/complaints"
            className="secondary-button"
          >
            Cancel
          </Link>

          <button
            type="submit"
            className="primary-button"
            disabled={submitting}
          >
            {submitting
              ? "Submitting..."
              : "Submit complaint"}
          </button>
        </div>
      </form>
    </div>
  );
}